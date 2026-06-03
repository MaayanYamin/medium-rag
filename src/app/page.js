export default function Home() {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '60px auto', padding: '0 20px' }}>
      <h1>Medium Article RAG API</h1>
      <p>Available endpoints:</p>
      <ul>
        <li><code>POST /api/prompt</code> — query the RAG system</li>
        <li><code>GET /api/stats</code> — view RAG configuration</li>
      </ul>

      <h2 style={{ marginTop: 32 }}>POST /api/prompt</h2>
      <p>Request body:</p>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>
{`{
  "question": "Your question here"
}`}
      </pre>

      <h2 style={{ marginTop: 32 }}>GET /api/stats</h2>
      <pre style={{ background: '#f4f4f4', padding: 16, borderRadius: 8 }}>
{`{
  "chunk_size": 512,
  "overlap_ratio": 0.2,
  "top_k": 9
}`}
      </pre>
    </main>
  )
}
