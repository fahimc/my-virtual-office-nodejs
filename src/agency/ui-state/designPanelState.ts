import type { AgencyStoreData } from '../memory/memoryStore.js';
import type { Artifact } from '../schemas/artifact.schema.js';

export function buildDesignPanelState(data: AgencyStoreData, projectId?: string) {
  const filter = <T extends { projectId: string }>(items: T[]) => items.filter(item => !projectId || item.projectId === projectId);
  const creativeDirections = filter(data.design.creativeDirections);
  const selectedDirection = filter(data.design.selectedDirections).at(-1);
  const qaReports = filter(data.design.qaReports);
  const handoff = filter(data.design.handoffs).at(-1);
  const imageryPlan = data.imageryPlans.filter(item => !projectId || item.projectId === projectId).at(-1);
  const generatedImages = data.generatedImages.filter(item => !projectId || item.projectId === projectId);
  const costEntries = data.costLedger.filter(item => !projectId || item.projectId === projectId);
  const rawArtifacts = data.artifacts.filter(item => (!projectId || item.projectId === projectId) && item.path?.startsWith('project/design/'));
  const artifacts = summarizeDesignArtifacts(rawArtifacts);
  const phase = handoff ? 'handoff_ready' : selectedDirection ? 'production_design' : creativeDirections.length ? 'creative_direction_approval' : filter(data.design.briefs).length ? 'discovery' : 'not_started';
  return {
    phase,
    selectedDirection,
    creativeDirections,
    designBrief: filter(data.design.briefs).at(-1),
    brandAudit: filter(data.design.brandAudits).at(-1),
    competitorResearch: filter(data.design.competitorResearch).at(-1),
    sitemap: filter(data.design.sitemaps).at(-1),
    wireframes: filter(data.design.wireframes).at(-1),
    tokens: filter(data.design.tokens).at(-1),
    componentSpec: filter(data.design.componentSpecs).at(-1),
    prototype: filter(data.design.prototypes).at(-1),
    imageryPlan,
    generatedImages,
    finance: {
      estimatedCostUsd: Number(costEntries.reduce((sum, item) => sum + item.estimatedCostUsd, 0).toFixed(6)),
      actualCostUsd: Number(costEntries.reduce((sum, item) => sum + (item.actualCostUsd || 0), 0).toFixed(6)),
      imageGenerationEntries: costEntries.filter(item => item.toolName === 'design.openai_image_generation')
    },
    qaReport: qaReports.at(-1),
    postBuildReview: qaReports.filter(report => (report.designArtifactIds || []).length === 0).at(-1),
    handoff,
    artifacts: artifacts.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      path: item.path,
      url: item.url || `/api/agency/artifact/${item.id}`
    })),
    artifactCount: artifacts.length,
    totalArtifactCount: rawArtifacts.length
  };
}

function summarizeDesignArtifacts(artifacts: Artifact[]): Artifact[] {
  const byKey = new Map<string, Artifact>();
  for (const artifact of artifacts) {
    const key = artifact.path || `${artifact.type}:${artifact.title}`;
    const existing = byKey.get(key);
    if (!existing || Date.parse(artifact.createdAt || '') >= Date.parse(existing.createdAt || '')) {
      byKey.set(key, artifact);
    }
  }
  return [...byKey.values()]
    .sort((a, b) => Date.parse(a.createdAt || '') - Date.parse(b.createdAt || ''))
    .slice(-60);
}
