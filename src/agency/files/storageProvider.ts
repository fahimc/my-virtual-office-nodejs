export interface StoredObject {
  storageProvider: 'local' | 'minio' | 's3' | 'r2';
  storagePath: string;
  publicUrl?: string;
}

export interface StorageProvider {
  readonly name: StoredObject['storageProvider'];
  put(input: { projectId: string; filename: string; content: Buffer; mimeType: string }): Promise<StoredObject>;
  delete(storagePath: string): Promise<void>;
}
