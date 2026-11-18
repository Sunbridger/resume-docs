import { hashToken, tokenize } from "./tokenize";

const K1 = 1.35;
const B = 0.72;

interface DocStats {
  tf: Map<string, number>;
  length: number;
}

export class BM25Index {
  private docs: DocStats[] = [];

  private df = new Map<string, number>();

  private avgLength = 1;

  constructor(documents: string[]) {
    let total = 0;
    for (const text of documents) {
      const tokens = tokenize(text);
      const tf = new Map<string, number>();
      for (const token of tokens) tf.set(token, (tf.get(token) ?? 0) + 1);
      for (const token of tf.keys()) this.df.set(token, (this.df.get(token) ?? 0) + 1);
      this.docs.push({ tf, length: tokens.length });
      total += tokens.length;
    }
    this.avgLength = total / Math.max(documents.length, 1);
  }

  score(queryTokens: string[]): number[] {
    const scores = new Array(this.docs.length).fill(0);
    const unique = [...new Set(queryTokens)];
    const N = this.docs.length;

    for (const token of unique) {
      const df = this.df.get(token);
      if (!df) continue;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      this.docs.forEach((doc, i) => {
        const tf = doc.tf.get(token);
        if (!tf) return;
        const denominator = tf + K1 * (1 - B + (B * doc.length) / this.avgLength);
        scores[i] += (idf * (tf * (K1 + 1))) / denominator;
      });
    }
    return scores;
  }
}

export const VECTOR_DIM = 192;

function buildVector(tokens: string[]): Float32Array {
  const vector = new Float32Array(VECTOR_DIM);
  for (const token of tokens) {
    const index = hashToken(token) % VECTOR_DIM;
    vector[index] += 1;
  }
  let norm = 0;
  for (let i = 0; i < VECTOR_DIM; i += 1) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < VECTOR_DIM; i += 1) vector[i] /= norm;
  return vector;
}

export class VectorIndex {
  private vectors: Float32Array[] = [];

  constructor(documents: string[]) {
    this.vectors = documents.map((text) => buildVector(tokenize(text)));
  }

  cosine(queryTokens: string[]): number[] {
    const q = buildVector(queryTokens);
    return this.vectors.map((vector) => {
      let dot = 0;
      for (let i = 0; i < VECTOR_DIM; i += 1) dot += q[i] * vector[i];
      return dot;
    });
  }
}

/** 把无上界的 BM25 分数压到 0–1，便于与余弦相似度融合。 */
export function squashBM25(score: number): number {
  return 1 - Math.exp(-score / 4);
}
