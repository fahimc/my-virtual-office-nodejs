import type { Project } from '../schemas/project.schema.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';
import { createId, nowIso, type MemoryStore } from './memoryStore.js';

export class ProjectMemory {
  constructor(private readonly store: MemoryStore) {}

  async create(customerId: string, originalBrief: string, structuredBrief: StructuredBrief): Promise<Project> {
    const timestamp = nowIso();
    const title = structuredBrief.businessSummary.slice(0, 70) || 'Website project';
    const project: Project = {
      id: createId('project'),
      customerId,
      status: 'planning',
      title,
      originalBrief,
      structuredBrief,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await this.store.update(data => {
      data.projects.push(project);
      data.briefHistory.push({ customerId, projectId: project.id, originalBrief, structuredBrief, createdAt: timestamp });
    });
    return project;
  }

  async get(projectId: string): Promise<Project | undefined> {
    const data = await this.store.read();
    return data.projects.find(project => project.id === projectId);
  }

  async update(projectId: string, patch: Partial<Project>): Promise<Project> {
    let updated: Project | undefined;
    await this.store.update(data => {
      const project = data.projects.find(item => item.id === projectId);
      if (!project) throw new Error(`Project not found: ${projectId}`);
      Object.assign(project, patch, { updatedAt: nowIso() });
      updated = project;
    });
    return updated!;
  }
}
