export interface Prototype {
  projectId: string;
  type: 'code-first' | 'figma' | 'penpot' | 'spec-only';
  previewUrl?: string;
  filePaths: string[];
  screenshots: string[];
  viewportCoverage: Array<'desktop' | 'tablet' | 'mobile'>;
  knownIssues: string[];
  createdAt: string;
}
