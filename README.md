# Medium Article RAG

RAG system built on ~7,600 Medium articles. Deployed on Vercel with Pinecone as the vector database.

## Hyperparameters

| Parameter | Value |
|-----------|-------|
| chunk_size | 512 |
| overlap_ratio | 0.2 |
| top_k | 8 |
| embedding model | text-embedding-3-small (dim: 1536) |
| chat model | gpt-5-mini |

## Endpoints

### POST /api/prompt
Query the RAG system with a natural language question.

**Request:**
```json
{ "question": "Your question here" }
```

**Response:**
```json
{
  "response": "Answer from the model.",
  "context": [
    {
      "article_id": "123",
      "title": "Article title",
      "chunk": "Retrieved passage...",
      "score": 0.8321
    }
  ],
  "Augmented_prompt": {
    "System": "system prompt...",
    "User": "user prompt with context..."
  }
}
```

### GET /api/stats
Returns current RAG configuration.

```json
{ "chunk_size": 512, "overlap_ratio": 0.2, "top_k": 8 }
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import on vercel.com
3. Add environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX`
