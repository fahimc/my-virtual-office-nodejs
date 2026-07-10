export class CoolifyProvider {
  async prepare(projectId: string): Promise<{ prepared: boolean; target: string }> {
    return { prepared: false, target: `coolify:${projectId}` };
  }
}
