export class InvoiceService {
  async createInvoice(input: { projectId: string; amount: number }) {
    return { invoiceId: `invoice-${Date.now()}`, status: 'draft', ...input };
  }
}
