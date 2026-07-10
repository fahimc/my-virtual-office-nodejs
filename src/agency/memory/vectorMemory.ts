export interface VectorMemoryResult {
  id: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface VectorMemory {
  upsert(id: string, text: string, metadata: Record<string, unknown>): Promise<void>;
  search(query: string, limit?: number): Promise<VectorMemoryResult[]>;
}

export class LocalKeywordVectorMemory implements VectorMemory {
  private readonly records = new Map<string, { text: string; metadata: Record<string, unknown> }>();

  async upsert(id: string, text: string, metadata: Record<string, unknown>): Promise<void> {
    this.records.set(id, { text, metadata });
  }

  async search(query: string, limit = 5): Promise<VectorMemoryResult[]> {
    const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
    return [...this.records.entries()]
      .map(([id, record]) => {
        const haystack = record.text.toLowerCase();
        const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
        return { id, text: record.text, score, metadata: record.metadata };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}
