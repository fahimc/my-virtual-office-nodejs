export class PaymentStatusService {
  async getStatus(projectId: string) {
    return { projectId, status: 'not_configured' };
  }
}
