import { Pinecone } from '@pinecone-database/pinecone'
import OpenAI from 'openai'

// ── Config ────────────────────────────────────────────────────────
const EMBEDDING_MODEL = '4UHRUIN-text-embedding-3-small'
const CHAT_MODEL      = '4UHRUIN-gpt-5-mini'
const TOP_K           = 9    // number of chunks to fetch and return

// ── Required system prompt (from assignment spec) ─────────────────
const SYSTEM_PROMPT = `You are a Medium-article assistant that answers questions strictly and only \
based on the Medium articles dataset context provided to you (metadata and article passages). \
You must not use any external knowledge, the open internet, or information that is not explicitly \
contained in the retrieved context. If the answer cannot be determined from the provided context, \
respond: "I don't know based on the provided Medium articles data."
Always explain your answer using the given context, quoting or paraphrasing the relevant \
article passage or metadata when helpful.`

// ── Lazy singletons (reused across warm invocations) ──────────────
let pineconeIndex = null
let openaiClient  = null

function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey:  process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    })
  }
  return openaiClient
}

async function getPineconeIndex() {
  if (!pineconeIndex) {
    const pc    = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    pineconeIndex = pc.index(process.env.PINECONE_INDEX ?? 'medium-rag')
  }
  return pineconeIndex
}

// ── Step 1: Retrieve ──────────────────────────────────────────────
// Fetches TOP_K chunks directly from Pinecone without deduplication.
async function retrieve(question) {
  const client = getOpenAI()
  const index  = await getPineconeIndex()

  // Embed the question
  const embeddingRes = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: question,
  })
  const qVector = embeddingRes.data[0].embedding

  // Fetch exactly TOP_K chunks
  const results = await index.query({
    vector:          qVector,
    topK:            TOP_K,
    includeMetadata: true,
  })

  // Return direct matches
  return results.matches || []
}

// ── Step 2: Build augmented user prompt ──────────────────────────
function buildUserPrompt(question, matches) {
  const contextBlocks = matches.map((m, i) => {
    const meta = m.metadata ?? {}
    return [
      `[Article ${i + 1}]`,
      `Title   : ${meta.title   ?? 'Unknown'}`,
      `Authors : ${meta.authors ?? 'Unknown'}`,
      `Tags    : ${meta.tags    ?? ''}`,
      `Passage : ${meta.chunk   ?? ''}`,
    ].join('\n')
  })

  return `Context from Medium articles:\n\n${contextBlocks.join('\n\n')}\n\n---\nQuestion: ${question}`
}

// ── Step 3: Generate ─────────────────────────────────────────────
async function generate(userPrompt) {
  const client = getOpenAI()

  const completion = await client.chat.completions.create({
    model:      CHAT_MODEL,
    max_tokens: 5000,   // high enough for reasoning model's internal thinking + output
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userPrompt    },
    ],
  })

  return completion.choices[0].message.content ?? ''
}

// ── Handler ───────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json()
    const question = body?.question

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return Response.json(
        { error: 'Missing or empty "question" field in request body.' },
        { status: 400 }
      )
    }

    // Run the full RAG pipeline
    const matches    = await retrieve(question.trim())
    const userPrompt = buildUserPrompt(question.trim(), matches)
    const answer     = await generate(userPrompt)

    // Build response exactly matching the assignment spec
    const response = {
      response: answer,
      context: matches.map(m => ({
        article_id: m.metadata?.article_id ?? '',
        title:      m.metadata?.title      ?? '',
        chunk:      m.metadata?.chunk      ?? '',
        score:      Math.round(m.score * 10000) / 10000,
      })),
      Augmented_prompt: {
        System: SYSTEM_PROMPT,
        User:   userPrompt,
      },
    }

    return Response.json(response, { status: 200 })

  } catch (error) {
    console.error('RAG pipeline error:', error)
    return Response.json(
      { error: 'Internal server error.', detail: error.message },
      { status: 500 }
    )
  }
}
