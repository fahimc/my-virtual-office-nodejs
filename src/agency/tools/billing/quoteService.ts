export class QuoteService {
  async createQuote(input: { projectId: string; lineItems: Array<{ title: string; amount: number }> }) {
    const total = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
    return { projectId: input.projectId, total, status: 'draft' };
  }
}
