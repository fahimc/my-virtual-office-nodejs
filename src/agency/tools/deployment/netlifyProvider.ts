export class NetlifyProvider {
  async prepare(projectId: string): Promise<{ prepared: boolean; target: string }> {
    return { prepared: true, target: `netlify:${projectId}` };
  }

  async deploy(projectId: string): Promise<{ liveUrl: string }> {
    return { liveUrl: `https://preview.example.com/${projectId}` };
  }
}
