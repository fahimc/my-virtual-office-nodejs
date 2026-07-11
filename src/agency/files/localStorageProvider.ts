import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageProvider, StoredObject } from './storageProvider.js';

export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local' as const;

  constructor(private readonly workspaceRoot: string) {}

  async put(input: { projectId: string; filename: string; content: Buffer; mimeType: string }): Promise<StoredObject> {
    const safeName = input.filename.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
    const relativePath = path.join('public', 'uploads', input.projectId, `${Date.now()}-${safeName}`);
    const absolutePath = path.join(this.workspaceRoot, relativePath);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.content);
    return {
      storageProvider: this.name,
      storagePath: relativePath.replaceAll('\\', '/'),
      publicUrl: `/${relativePath.replaceAll('\\', '/')}`.replace('/public/', '/')
    };
  }

  async delete(storagePath: string): Promise<void> {
    if (!storagePath.startsWith('public/uploads/')) return;
    await fs.rm(path.join(this.workspaceRoot, storagePath), { force: true });
  }
}
