export type ArtifactType = 'plan' | 'design' | 'design_options' | 'copy' | 'code' | 'qa_report' | 'preview' | 'deployment';

export interface Artifact {
  id: string;
  projectId: string;
  type: ArtifactType;
  title: string;
  path?: string;
  url?: string;
  metadata: Record<string, unknown>;
  createdByAgentId: string;
  createdAt: string;
}
