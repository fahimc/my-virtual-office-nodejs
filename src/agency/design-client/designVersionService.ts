import type { MemoryStore } from '../memory/memoryStore.js';
import { designDirectionView } from './designDirectionViewer.js';

export class DesignVersionService {
  constructor(private readonly store: MemoryStore) {}

  async current(projectId: string) {
    return designDirectionView(await this.store.read(), projectId);
  }
}
