import type { MemoryStore } from './memoryStore.js';

export class DesignMemory {
  constructor(private readonly store: MemoryStore) {}

  async project(projectId: string) {
    const data = await this.store.read();
    return {
      brief: data.design.briefs.find(item => item.projectId === projectId),
      brandAudit: data.design.brandAudits.find(item => item.projectId === projectId),
      competitorResearch: data.design.competitorResearch.find(item => item.projectId === projectId),
      creativeDirections: data.design.creativeDirections.filter(item => item.projectId === projectId),
      selectedDirection: data.design.selectedDirections.find(item => item.projectId === projectId),
      sitemap: data.design.sitemaps.find(item => item.projectId === projectId),
      wireframes: data.design.wireframes.find(item => item.projectId === projectId),
      tokens: data.design.tokens.find(item => item.projectId === projectId),
      componentSpec: data.design.componentSpecs.find(item => item.projectId === projectId),
      prototype: data.design.prototypes.find(item => item.projectId === projectId),
      handoff: data.design.handoffs.find(item => item.projectId === projectId),
      qaReports: data.design.qaReports.filter(item => item.projectId === projectId)
    };
  }
}
