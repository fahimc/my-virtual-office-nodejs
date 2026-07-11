import type { StorageProvider } from './storageProvider.js';

export class MinioStorageProvider implements StorageProvider {
  readonly name = 'minio' as const;

  async put(): Promise<never> {
    throw new Error('MinIO storage adapter is configured as a boundary but is not enabled. Set MINIO_ENDPOINT, MINIO_BUCKET, and credentials to implement it.');
  }

  async delete(): Promise<void> {
    return undefined;
  }
}
