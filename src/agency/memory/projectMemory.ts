import type { Project } from '../schemas/project.schema.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';
import { createId, nowIso, type MemoryStore } from './memoryStore.js';

export class ProjectMemory {
  constructor(private readonly store: MemoryStore) {}

  async create(customerId: string, originalBrief: string, structuredBrief: StructuredBrief): Promise<Project> {
    const timestamp = nowIso();
    const title = projectTitle(originalBrief, structuredBrief);
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

function projectTitle(originalBrief: string, structuredBrief: StructuredBrief): string {
  const candidate = extractProjectNameLabel(originalBrief) || structuredBrief.businessSummary.split(':')[0] || 'Website project';
  const cleaned = cleanProjectTitle(candidate);
  return cleaned.slice(0, 70) || 'Website project';
}

function extractProjectNameLabel(text: string): string | undefined {
  const patterns = [
    /(?:^|\n)\s*project\s+name\s*[:\-]\s*(?:\*\*)?([^\n*#][^\n]*?)(?:\*\*)?\s*(?=\n|$)/i,
    /(?:^|\n)\s*project\s+name\s*\n+\s*(?:[-*]\s*)?(?:\*\*)?([^\n*#][^\n]*?)(?:\*\*)?\s*(?=\n|$)/i,
    /(?:^|\n)\s*project\s+name\s+(?:\*\*)?([^\n*#][^\n]*?)(?:\*\*)?\s*(?=\n|$)/i
  ];
  for (const pattern of patterns) {
    const candidate = cleanProjectTitle(text.match(pattern)?.[1] || '');
    if (candidate && !/^project\s+(summary|brief|overview|name)$/i.test(candidate)) return candidate;
  }
  return undefined;
}

function cleanProjectTitle(value: string): string {
  return value.replace(/[#*_`>]/g, '').replace(/\s+/g, ' ').trim();
}
