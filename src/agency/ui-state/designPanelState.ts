import type { AgencyStoreData } from '../memory/memoryStore.js';

export function buildDesignPanelState(data: AgencyStoreData, projectId?: string) {
  const filter = <T extends { projectId: string }>(items: T[]) => items.filter(item => !projectId || item.projectId === projectId);
  const creativeDirections = filter(data.design.creativeDirections);
  const selectedDirection = filter(data.design.selectedDirections).at(-1);
  const qaReports = filter(data.design.qaReports);
  const handoff = filter(data.design.handoffs).at(-1);
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
    qaReport: qaReports.at(-1),
    postBuildReview: qaReports.filter(report => report.designArtifactIds.length === 0).at(-1),
    handoff,
    artifactCount: data.artifacts.filter(item => (!projectId || item.projectId === projectId) && item.path?.startsWith('project/design/')).length
  };
}
