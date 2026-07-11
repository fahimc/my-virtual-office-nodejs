import type { CustomerFileUploadService } from './customerFileUploadService.js';

export class AssetLibraryService {
  constructor(private readonly files: CustomerFileUploadService) {}

  listProjectAssets(projectId: string) {
    return this.files.list(projectId);
  }
}
