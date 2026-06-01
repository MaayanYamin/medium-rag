// GET /api/stats
// Returns the RAG hyperparameters as required by the assignment spec.
// Field names must match exactly: chunk_size, overlap_ratio, top_k

export async function GET() {
  return Response.json({
    chunk_size:    512,
    overlap_ratio: 0.2,
    top_k:         8,
  })
}
