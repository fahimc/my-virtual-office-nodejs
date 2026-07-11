import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import type { CustomerFile, CustomerFileCategory } from '../schemas/customerFile.schema.js';
import type { StorageProvider } from './storageProvider.js';

const allowedMimePrefixes = ['image/', 'application/pdf', 'text/plain', 'text/markdown', 'application/json'];
const maxUploadBytes = 12 * 1024 * 1024;

export class CustomerFileUploadService {
  constructor(
    private readonly store: MemoryStore,
    private readonly storage: StorageProvider
  ) {}

  async list(projectId: string): Promise<CustomerFile[]> {
    const data = await this.store.read();
    return data.customerFiles
      .filter(item => item.projectId === projectId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  async upload(input: {
    projectId: string;
    customerId: string;
    originalFilename: string;
    mimeType: string;
    contentBase64: string;
    category?: CustomerFileCategory;
    uploadedBy?: CustomerFile['uploadedBy'];
  }): Promise<CustomerFile> {
    if (!isAllowedMime(input.mimeType)) throw new Error(`Unsupported file type: ${input.mimeType}`);
    const content = Buffer.from(input.contentBase64, 'base64');
    if (content.byteLength > maxUploadBytes) throw new Error('File is too large for local portal upload');
    const stored = await this.storage.put({
      projectId: input.projectId,
      filename: input.originalFilename,
      content,
      mimeType: input.mimeType
    });
    const file: CustomerFile = {
      id: createId('customer-file'),
      projectId: input.projectId,
      customerId: input.customerId,
      filename: stored.storagePath.split('/').pop() || input.originalFilename,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      size: content.byteLength,
      storageProvider: stored.storageProvider,
      storagePath: stored.storagePath,
      publicUrl: stored.publicUrl,
      category: input.category || 'other',
      uploadedBy: input.uploadedBy || 'customer',
      createdAt: nowIso()
    };
    await this.store.update(data => {
      data.customerFiles.push(file);
    });
    return file;
  }

  async delete(projectId: string, fileId: string): Promise<void> {
    let storagePath: string | undefined;
    await this.store.update(data => {
      const file = data.customerFiles.find(item => item.projectId === projectId && item.id === fileId);
      storagePath = file?.storagePath;
      data.customerFiles = data.customerFiles.filter(item => !(item.projectId === projectId && item.id === fileId));
    });
    if (storagePath) await this.storage.delete(storagePath);
  }
}

function isAllowedMime(mimeType: string): boolean {
  return allowedMimePrefixes.some(prefix => prefix.endsWith('/') ? mimeType.startsWith(prefix) : mimeType === prefix);
}
