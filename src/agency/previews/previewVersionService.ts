import { createId, nowIso, type MemoryStore } from '../memory/memoryStore.js';
import type { Project } from '../schemas/project.schema.js';
import type { PreviewVersion } from '../schemas/previewVersion.schema.js';
import { PreviewAccessService } from './previewAccessService.js';
import { PreviewScreenshotService } from './previewScreenshotService.js';

export class PreviewVersionService {
  private readonly access = new PreviewAccessService();
  private readonly screenshots = new PreviewScreenshotService();

  constructor(private readonly store: MemoryStore) {}

  async list(projectId: string): Promise<PreviewVersion[]> {
    const data = await this.store.read();
    return data.previewVersions
      .filter(item => item.projectId === projectId)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  async current(projectId: string): Promise<PreviewVersion | undefined> {
    return (await this.list(projectId))[0];
  }

  async ensureForProject(project: Project, changelog: string[] = ['Preview prepared for customer review.']): Promise<PreviewVersion | undefined> {
    const previewUrl = project.previewUrl || `/previews/${project.id}/`;
    if (!previewUrl) return undefined;
    const current = await this.current(project.id);
    if (current?.previewUrl === previewUrl && current.status !== 'archived') return current;
    return this.create({
      projectId: project.id,
      previewUrl,
      sourceBranch: project.currentWorkflowRunId,
      changelog
    });
  }

  async create(input: { projectId: string; previewUrl: string; sourceBranch?: string; buildId?: string; changelog?: string[] }): Promise<PreviewVersion> {
    const existing = await this.list(input.projectId);
    const versionNumber = Math.max(0, ...existing.map(item => item.versionNumber)) + 1;
    const version: PreviewVersion = {
      id: createId('preview-version'),
      projectId: input.projectId,
      versionNumber,
      previewUrl: input.previewUrl,
      sourceBranch: input.sourceBranch,
      buildId: input.buildId,
      deploymentProvider: 'local',
      screenshots: await this.screenshots.capture(input.projectId, input.previewUrl),
      status: 'published',
      changelog: input.changelog || ['Preview version created.'],
      accessToken: this.access.createToken(input.projectId, versionNumber),
      createdAt: nowIso()
    };
    await this.store.update(data => {
      data.previewVersions.push(version);
    });
    return version;
  }

  async markApproved(id: string): Promise<PreviewVersion> {
    let result: PreviewVersion | undefined;
    await this.store.update(data => {
      const version = data.previewVersions.find(item => item.id === id);
      if (!version) throw new Error(`Preview version not found: ${id}`);
      version.status = 'approved';
      version.approvedAt = nowIso();
      result = version;
    });
    return result!;
  }
}
