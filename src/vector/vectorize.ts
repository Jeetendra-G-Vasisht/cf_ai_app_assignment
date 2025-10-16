// Vectorize helper (stub): replace with Cloudflare Vectorize client calls.
export async function embedText(text: string) {
  // In production: call Vectorize / embeddings endpoint and return vector
  // This is a placeholder returning a small deterministic pseudo-vector.
  const v = Array.from({ length: 8 }, (_, i) => (text.charCodeAt(i % text.length) || 0) / 255);
  return v;
}
