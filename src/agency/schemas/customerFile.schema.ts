export type CustomerFileCategory =
  | 'logo'
  | 'brand_guidelines'
  | 'photos'
  | 'copy'
  | 'testimonials'
  | 'products'
  | 'documents'
  | 'old_website'
  | 'legal'
  | 'other';

export interface CustomerFile {
  id: string;
  projectId: string;
  customerId: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  storageProvider: 'local' | 'minio' | 's3' | 'r2';
  storagePath: string;
  publicUrl?: string;
  category: CustomerFileCategory;
  uploadedBy: 'customer' | 'agency' | 'agent' | 'system';
  createdAt: string;
}
