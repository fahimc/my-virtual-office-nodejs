export type ArtifactType =
  | 'plan'
  | 'design'
  | 'design_brief'
  | 'brand_audit'
  | 'competitor_research'
  | 'moodboard'
  | 'creative_direction'
  | 'design_options'
  | 'sitemap'
  | 'wireframe'
  | 'design_tokens'
  | 'component_spec'
  | 'prototype'
  | 'design_handoff'
  | 'design_qa'
  | 'post_build_design_review'
  | 'copy'
  | 'code'
  | 'qa_report'
  | 'preview'
  | 'deployment';

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
