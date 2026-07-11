export interface PreviewContainerResult {
  provider: 'local' | 'docker' | 'coolify';
  url: string;
  notes: string[];
}

export class PreviewContainerService {
  async createLocal(url: string): Promise<PreviewContainerResult> {
    return { provider: 'local', url, notes: ['Local preview adapter is active. Docker/Coolify can be enabled later.'] };
  }
}
