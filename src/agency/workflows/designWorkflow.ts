import type { ApprovalService } from '../approvals/approvalService.js';
import type { CompanyOS } from '../company/companyOS.js';
import type { MemoryStore } from '../memory/memoryStore.js';
import { createId, nowIso } from '../memory/memoryStore.js';
import type { Project } from '../schemas/project.schema.js';
import type { Customer } from '../schemas/customer.schema.js';
import type { CreativeDirection, SelectedDirection } from '../schemas/creativeDirection.schema.js';
import type { WorkflowRuntime } from '../runtime/workflowRuntime.js';
import {
  createBrandAudit,
  createComponentSpec,
  createCompetitorResearch,
  createCreativeDirections,
  createDesignBrief,
  createDesignQa,
  createDesignTokens,
  createHandoff,
  createPrototype,
  createSitemap,
  createWireframe,
  selectDirection
} from '../tools/design/designArtifactFactory.js';
import { createBrandGuidelinesFiles } from '../tools/design/brandGuidelinesTool.js';
import type { ArtifactType } from '../schemas/artifact.schema.js';
import { VisualReviewService } from '../tools/design/visualReviewService.js';

export class DesignWorkflow {
  private readonly visualReview = new VisualReviewService();

  constructor(
    private readonly store: MemoryStore,
    private readonly approvals: ApprovalService,
    private readonly companyOS: CompanyOS,
    private readonly workflowRuntime: WorkflowRuntime
  ) {}

  async start(project: Project, customer: Customer, workflowRunId: string) {
    if (!project.structuredBrief) throw new Error('Design workflow requires a structured brief');
    await this.createDesignTasks(project.id);
    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'design_discovery', state: {}, createdAt: '', updatedAt: '' }, 'design.discovery.started', {});
    const designBrief = createDesignBrief({ projectId: project.id, customer, structuredBrief: project.structuredBrief, originalBrief: project.originalBrief });
    await this.saveDesign(project.id, 'briefs', designBrief, 'design_brief', 'design-brief.json', 'Design brief');
    await this.completeTask(project.id, 'design_discovery', { designBriefId: project.id });
    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'design_discovery', state: {}, createdAt: '', updatedAt: '' }, 'design.discovery.completed', {});

    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'brand_audit', state: {}, createdAt: '', updatedAt: '' }, 'design.brand_audit.started', {});
    const brandAudit = createBrandAudit(designBrief);
    await this.saveDesign(project.id, 'brandAudits', brandAudit, 'brand_audit', 'brand-audit.md', 'Brand audit');
    await this.completeTask(project.id, 'brand_audit', { brandAudit });
    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'brand_audit', state: {}, createdAt: '', updatedAt: '' }, 'design.brand_audit.completed', {});

    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'competitor_research', state: {}, createdAt: '', updatedAt: '' }, 'design.competitor_research.started', {});
    const competitorResearch = createCompetitorResearch(designBrief);
    await this.saveDesign(project.id, 'competitorResearch', competitorResearch, 'competitor_research', 'competitor-research.md', 'Competitor research');
    await this.completeTask(project.id, 'competitor_research', { competitorResearch });
    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'competitor_research', state: {}, createdAt: '', updatedAt: '' }, 'design.competitor_research.completed', {});

    const directions = createCreativeDirections(designBrief);
    await this.store.update(data => {
      data.design.creativeDirections = data.design.creativeDirections.filter(item => item.projectId !== project.id);
      data.design.creativeDirections.push(...directions);
    });
    await this.saveArtifact(project.id, 'creative_direction', 'creative-directions.json', 'Creative directions', { directions });
    await this.saveArtifact(project.id, 'design_options', 'creative-directions.json', 'Design options', { options: directions });
    await this.completeTask(project.id, 'creative_direction', { directions });
    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'creative_directions', state: {}, createdAt: '', updatedAt: '' }, 'design.creative_directions.created', { directions });

    const approval = await this.approvals.request({
      projectId: project.id,
      type: 'design_options',
      title: 'Choose a creative direction',
      description: 'Review the agency-grade creative directions before sitemap, wireframes, tokens, prototype, and build handoff are created.',
      requestedByAgentId: 'design',
      payload: { workflowRunId, designOptions: directions }
    });
    const approvalTask = await this.companyOS.taskBoard.createTask({
      projectId: project.id,
      title: 'Approve creative direction',
      description: 'Client-facing creative direction approval gate.',
      type: 'design_approval',
      assignedAgentId: 'design',
      createdByAgentId: 'design',
      input: { approvalId: approval.id },
      approvalRequired: true
    });
    await this.companyOS.taskBoard.updateTask(approvalTask.id, { status: 'reviewing' });
    await this.workflowRuntime.emit({ id: workflowRunId, projectId: project.id, workflowName: 'websiteBuildWorkflow', status: 'running', currentStep: 'design_approval', state: {}, createdAt: '', updatedAt: '' }, 'design.approval.requested', { approval });
    return { designBrief, brandAudit, competitorResearch, directions, approval };
  }

  async completeAfterApproval(projectId: string, selectedDirection: CreativeDirection, approvalId?: string) {
    const data = await this.store.read();
    const designBrief = data.design.briefs.find(item => item.projectId === projectId);
    if (!designBrief) throw new Error('Design brief missing');
    const directions = data.design.creativeDirections.filter(item => item.projectId === projectId);
    const orderedDirections = [selectedDirection, ...directions.filter(item => item.id !== selectedDirection.id)];
    const selected: SelectedDirection = {
      ...selectDirection(orderedDirections.length ? orderedDirections : [selectedDirection], 'approval', approvalId),
      selectedDirectionId: selectedDirection.id,
      approvedByUser: true
    };
    await this.store.update(next => {
      next.design.selectedDirections = next.design.selectedDirections.filter(item => item.projectId !== projectId);
      next.design.selectedDirections.push(selected);
    });
    await this.saveArtifact(projectId, 'creative_direction', 'selected-direction.json', 'Selected direction', { selectedDirection: selected, direction: selectedDirection });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'direction_selected', state: {}, createdAt: '', updatedAt: '' }, 'design.direction.selected', { selected });

    const sitemap = createSitemap(designBrief, selectedDirection);
    await this.saveDesign(projectId, 'sitemaps', sitemap, 'sitemap', 'sitemap.json', 'Sitemap');
    await this.completeTask(projectId, 'sitemap', { sitemap });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'sitemap', state: {}, createdAt: '', updatedAt: '' }, 'design.sitemap.created', { sitemap });

    const wireframes = createWireframe(sitemap);
    await this.saveDesign(projectId, 'wireframes', wireframes, 'wireframe', 'wireframes.json', 'Wireframes');
    await this.completeTask(projectId, 'wireframe', { wireframes });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'wireframes', state: {}, createdAt: '', updatedAt: '' }, 'design.wireframes.created', { wireframes });

    const tokens = createDesignTokens(selectedDirection);
    await this.saveDesign(projectId, 'tokens', tokens, 'design_tokens', 'design-tokens.json', 'Design tokens');
    await this.saveArtifact(projectId, 'design_tokens', 'tailwind-theme.ts', 'Tailwind theme', { tailwindTheme: tokens.exportedTailwindTheme });
    await this.completeTask(projectId, 'design_tokens', { tokens });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'tokens', state: {}, createdAt: '', updatedAt: '' }, 'design.tokens.created', { tokens });

    const componentSpec = createComponentSpec(designBrief, sitemap);
    await this.saveDesign(projectId, 'componentSpecs', componentSpec, 'component_spec', 'component-spec.json', 'Component spec');
    await this.completeTask(projectId, 'component_system', { componentSpec });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'component_spec', state: {}, createdAt: '', updatedAt: '' }, 'design.component_spec.created', { componentSpec });

    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'prototype', state: {}, createdAt: '', updatedAt: '' }, 'design.prototype.started', {});
    const prototype = createPrototype(projectId);
    await this.saveDesign(projectId, 'prototypes', prototype, 'prototype', 'prototype-summary.md', 'Prototype summary');
    await this.completeTask(projectId, 'prototype', { prototype });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'prototype', state: {}, createdAt: '', updatedAt: '' }, 'design.prototype.created', { prototype });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'mobile_rules', state: {}, createdAt: '', updatedAt: '' }, 'design.mobile_rules.created', { mobileRules: wireframes.mobileLayout });

    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'imagery_generation', state: {}, createdAt: '', updatedAt: '' }, 'design.imagery.started', {});
    const imageryPlan = await this.companyOS.imagery.generateWebsiteImagery({
      projectId,
      customerId: designBrief.customerId,
      designBrief,
      direction: selectedDirection,
      mode: 'standard',
      count: 5
    });
    await this.saveArtifact(projectId, 'imagery_plan', 'imagery-plan.json', 'Website imagery plan', { imageryPlan });
    for (const image of [imageryPlan.hero, ...imageryPlan.pageImages, ...imageryPlan.sectionImages]) {
      await this.saveArtifact(projectId, 'generated_image', `imagery/${image.id}.json`, image.title, image as unknown as Record<string, unknown>);
    }
    await this.completeTask(projectId, 'imagery_generation', { imageryPlan });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'imagery_generation', state: {}, createdAt: '', updatedAt: '' }, 'design.imagery.completed', { imageryPlan });

    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'design_qa', state: {}, createdAt: '', updatedAt: '' }, 'design.qa.started', {});
    const qaReport = createDesignQa(projectId);
    await this.saveDesign(projectId, 'qaReports', qaReport, 'design_qa', 'design-qa-report.md', 'Design QA report');
    await this.completeTask(projectId, 'design_qa', { qaReport });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'design_qa', state: {}, createdAt: '', updatedAt: '' }, qaReport.passed ? 'design.qa.passed' : 'design.qa.failed', { qaReport });

    const handoff = createHandoff({ selectedDirection: selected, direction: selectedDirection, sitemap, wireframes, tokens, componentSpec, imageryPlan });
    const brandGuidelines = await createBrandGuidelinesFiles({ designBrief, direction: selectedDirection, tokens, componentSpec, handoff });
    await this.saveArtifact(projectId, 'brand_guidelines', 'brand-guidelines.html', 'Brand guidelines HTML', { guidelines: brandGuidelines.guidelines }, brandGuidelines.htmlUrl);
    await this.saveArtifact(projectId, 'brand_guidelines_pdf', 'brand-guidelines.pdf', 'Brand guidelines PDF', { guidelines: brandGuidelines.guidelines }, brandGuidelines.pdfUrl);
    await this.completeTask(projectId, 'brand_guidelines', { guidelines: brandGuidelines.guidelines, htmlUrl: brandGuidelines.htmlUrl, pdfUrl: brandGuidelines.pdfUrl });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'brand_guidelines', state: {}, createdAt: '', updatedAt: '' }, 'design.brand_guidelines.created', { brandGuidelines: brandGuidelines.guidelines });

    await this.saveDesign(projectId, 'handoffs', handoff, 'design_handoff', 'design-handoff.md', 'Builder handoff');
    await this.completeTask(projectId, 'builder_handoff', { handoff });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'handoff', state: {}, createdAt: '', updatedAt: '' }, 'design.handoff.created', { handoff });
    await this.workflowRuntime.emit({ id: approvalId || '', projectId, workflowName: 'designWorkflow', status: 'running', currentStep: 'handoff', state: {}, createdAt: '', updatedAt: '' }, 'design.handoff.sent_to_builder', { handoff });
    return { selected, sitemap, wireframes, tokens, componentSpec, prototype, qaReport, handoff };
  }

  async postBuildReview(projectId: string, previewUrl?: string) {
    await this.workflowRuntime.emit({ id: '', projectId, workflowName: 'postBuildDesignQaWorkflow', status: 'running', currentStep: 'post_build_review', state: {}, createdAt: '', updatedAt: '' }, 'design.post_build_review.started', { previewUrl });
    const screenshotResult = previewUrl ? await this.companyOS.screenshots.capture(previewUrl) : { screenshotPaths: [], summary: 'No preview URL was available for screenshot capture.' };
    const report = this.visualReview.createReport({
      projectId,
      previewUrl: previewUrl || '',
      screenshots: screenshotResult.screenshotPaths.map(path => ({
        viewport: path.includes('mobile') ? 'mobile' : path.includes('tablet') ? 'tablet' : 'desktop',
        path,
        width: path.includes('mobile') ? 390 : path.includes('tablet') ? 768 : 1440,
        height: path.includes('mobile') ? 844 : path.includes('tablet') ? 1024 : 1100
      })),
      codexDesignerNotes: screenshotResult.summary ? [screenshotResult.summary] : []
    });
    await this.saveDesign(projectId, 'qaReports', report, 'post_build_design_review', 'post-build-design-review.md', 'Post-build visual design review');
    await this.completeTask(projectId, 'post_build_design_qa', { report, previewUrl });
    if (!report.passed) {
      for (const issue of report.issues) {
        await this.companyOS.taskBoard.createTask({
          projectId,
          title: `Design fix: ${issue.title}`,
          description: `${issue.description}\n\nRecommended fix: ${issue.recommendation}`,
          type: 'design_fix',
          priority: issue.severity === 'high' ? 'high' : 'normal',
          assignedAgentId: 'builder',
          createdByAgentId: 'design',
          input: { issue, previewUrl }
        });
      }
    }
    await this.workflowRuntime.emit({ id: '', projectId, workflowName: 'postBuildDesignQaWorkflow', status: 'running', currentStep: 'post_build_review', state: {}, createdAt: '', updatedAt: '' }, report.passed ? 'design.post_build_review.passed' : 'design.post_build_review.failed', { report });
    return report;
  }

  private async createDesignTasks(projectId: string) {
    const existing = await this.companyOS.taskBoard.listTasks(projectId);
    if (existing.some(task => task.type === 'design_discovery')) return;
    const tasks = [
      ['Design Discovery', 'design_discovery'],
      ['Brand Audit', 'brand_audit'],
      ['Competitor Research', 'competitor_research'],
      ['Creative Direction', 'creative_direction'],
      ['Sitemap', 'sitemap'],
      ['Wireframes', 'wireframe'],
      ['Design Tokens', 'design_tokens'],
      ['Component System', 'component_system'],
      ['Prototype', 'prototype'],
      ['Website Imagery', 'imagery_generation'],
      ['Design QA', 'design_qa'],
      ['Brand Guidelines', 'brand_guidelines'],
      ['Design Approval', 'design_approval'],
      ['Builder Handoff', 'builder_handoff'],
      ['Post-Build Design QA', 'post_build_design_qa']
    ] as const;
    for (const [title, type] of tasks) {
      await this.companyOS.taskBoard.createTask({
        projectId,
        title,
        description: `${title} owned by the Designer Agent.`,
        type,
        assignedAgentId: 'design',
        createdByAgentId: 'design',
        input: {},
        approvalRequired: type === 'design_approval'
      });
    }
  }

  private async completeTask(projectId: string, type: string, output: Record<string, unknown>) {
    const task = (await this.companyOS.taskBoard.listTasks(projectId)).find(item => item.type === type && item.status !== 'done' && item.status !== 'completed');
    if (task) await this.companyOS.taskBoard.updateTask(task.id, { status: 'completed', output });
  }

  private async saveDesign<T>(projectId: string, key: keyof MemoryStoreDesignCollections, value: T, artifactType: ArtifactType, path: string, title: string) {
    await this.store.update(data => {
      const collection = data.design[key] as T[];
      const projectValue = value as { projectId?: string };
      data.design[key] = collection.filter(item => (item as { projectId?: string }).projectId !== projectValue.projectId) as never;
      (data.design[key] as T[]).push(value);
    });
    await this.saveArtifact(projectId, artifactType, path, title, value as Record<string, unknown>);
  }

  private async saveArtifact(projectId: string, type: ArtifactType, path: string, title: string, metadata: Record<string, unknown>, url?: string) {
    await this.store.update(data => {
      data.artifacts.push({
        id: createId('artifact'),
        projectId,
        type,
        title,
        path: `project/design/${path}`,
        url,
        metadata,
        createdByAgentId: 'design',
        createdAt: nowIso()
      });
    });
  }
}

interface MemoryStoreDesignCollections {
  briefs: unknown[];
  brandAudits: unknown[];
  competitorResearch: unknown[];
  sitemaps: unknown[];
  wireframes: unknown[];
  tokens: unknown[];
  componentSpecs: unknown[];
  prototypes: unknown[];
  handoffs: unknown[];
  qaReports: unknown[];
}
