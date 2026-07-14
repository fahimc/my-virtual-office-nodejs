import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Customer } from '../schemas/customer.schema.js';
import type { Project } from '../schemas/project.schema.js';
import type { StructuredBrief } from '../schemas/brief.schema.js';
import type { AgentTask } from '../schemas/task.schema.js';
import type { Artifact } from '../schemas/artifact.schema.js';
import type { ApprovalRequest } from '../schemas/approval.schema.js';
import type { WorkflowRun } from '../schemas/workflow.schema.js';
import type { AuditLog } from '../schemas/audit.schema.js';
import type { EmailDraft } from '../schemas/email.schema.js';
import type { GitHubBranchRecord, GitHubPullRequestRecord } from '../schemas/github.schema.js';
import type { DeploymentRecord, PreviewRecord } from '../schemas/deployment.schema.js';
import type { CompanyTask } from '../tools/taskboard/taskBoardTypes.js';
import type { CodexTask } from '../tools/codex/codexTaskAdapter.js';
import type { DesignBrief } from '../schemas/designBrief.schema.js';
import type { BrandAudit } from '../schemas/brandAudit.schema.js';
import type { CompetitorResearch } from '../schemas/competitorResearch.schema.js';
import type { CreativeDirection, SelectedDirection } from '../schemas/creativeDirection.schema.js';
import type { Sitemap } from '../schemas/sitemap.schema.js';
import type { Wireframe } from '../schemas/wireframe.schema.js';
import type { DesignTokens } from '../schemas/designTokens.schema.js';
import type { ComponentSpec } from '../schemas/componentSpec.schema.js';
import type { Prototype } from '../schemas/prototype.schema.js';
import type { DesignHandoff } from '../schemas/designHandoff.schema.js';
import type { DesignQaReport } from '../schemas/designQa.schema.js';
import type { ImplementationPlan } from '../schemas/implementationPlan.schema.js';
import type { GeneratedImageAsset, WebsiteImageryPlan } from '../schemas/generatedImage.schema.js';
import type { CostLedgerEntry } from '../schemas/costLedger.schema.js';
import type { UpdateFeedItem } from '../schemas/customerUpdate.schema.js';
import type { VisualFeedback } from '../schemas/visualFeedback.schema.js';
import type { PreviewVersion } from '../schemas/previewVersion.schema.js';
import type { ClientApproval } from '../schemas/clientApproval.schema.js';
import type { CustomerFile } from '../schemas/customerFile.schema.js';
import type { ClientMessage } from '../schemas/clientMessage.schema.js';

export interface AgencyStoreData {
  customers: Customer[];
  projects: Project[];
  tasks: AgentTask[];
  artifacts: Artifact[];
  approvals: ApprovalRequest[];
  workflows: WorkflowRun[];
  audits: AuditLog[];
  companyTasks: CompanyTask[];
  emailDrafts: EmailDraft[];
  codexTasks: CodexTask[];
  githubBranches: GitHubBranchRecord[];
  githubPullRequests: GitHubPullRequestRecord[];
  previews: PreviewRecord[];
  deployments: DeploymentRecord[];
  implementationPlans: ImplementationPlan[];
  generatedImages: GeneratedImageAsset[];
  imageryPlans: WebsiteImageryPlan[];
  costLedger: CostLedgerEntry[];
  customerUpdates: UpdateFeedItem[];
  visualFeedback: VisualFeedback[];
  previewVersions: PreviewVersion[];
  clientApprovals: ClientApproval[];
  customerFiles: CustomerFile[];
  clientMessages: ClientMessage[];
  notifications: Array<{ id: string; projectId?: string; type: string; title: string; message: string; read: boolean; createdAt: string }>;
  design: {
    briefs: DesignBrief[];
    brandAudits: BrandAudit[];
    competitorResearch: CompetitorResearch[];
    creativeDirections: CreativeDirection[];
    selectedDirections: SelectedDirection[];
    sitemaps: Sitemap[];
    wireframes: Wireframe[];
    tokens: DesignTokens[];
    componentSpecs: ComponentSpec[];
    prototypes: Prototype[];
    handoffs: DesignHandoff[];
    qaReports: DesignQaReport[];
    brandMemory: Array<{ customerId: string; projectId?: string; key: string; value: unknown; updatedAt: string }>;
    visualPreferenceMemory: Array<{ customerId: string; preference: string; sourceProjectId?: string; approved: boolean; updatedAt: string }>;
  };
  briefHistory: Array<{ customerId: string; projectId: string; originalBrief: string; structuredBrief?: StructuredBrief; createdAt: string }>;
}

const emptyStore = (): AgencyStoreData => ({
  customers: [],
  projects: [],
  tasks: [],
  artifacts: [],
  approvals: [],
  workflows: [],
  audits: [],
  companyTasks: [],
  emailDrafts: [],
  codexTasks: [],
  githubBranches: [],
  githubPullRequests: [],
  previews: [],
  deployments: [],
  implementationPlans: [],
  generatedImages: [],
  imageryPlans: [],
  costLedger: [],
  customerUpdates: [],
  visualFeedback: [],
  previewVersions: [],
  clientApprovals: [],
  customerFiles: [],
  clientMessages: [],
  notifications: [],
  design: {
    briefs: [],
    brandAudits: [],
    competitorResearch: [],
    creativeDirections: [],
    selectedDirections: [],
    sitemaps: [],
    wireframes: [],
    tokens: [],
    componentSpecs: [],
    prototypes: [],
    handoffs: [],
    qaReports: [],
    brandMemory: [],
    visualPreferenceMemory: []
  },
  briefHistory: []
});

export class MemoryStore {
  private updateChain: Promise<unknown> = Promise.resolve();
  private warnedAboutBlobFallback = false;
  private readonly useNetlifyBlobs = process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  private readonly blobStoreName = process.env.AGENCY_BLOB_STORE || 'agency-data';
  private readonly blobKey: string;

  constructor(private readonly filePath: string) {
    this.blobKey = path.basename(filePath);
  }

  async read(): Promise<AgencyStoreData> {
    await this.updateChain.catch(() => undefined);
    return this.readFromDisk();
  }

  private async readFromDisk(): Promise<AgencyStoreData> {
    if (this.useNetlifyBlobs) {
      const blobData = await this.tryReadFromBlob();
      if (blobData) return blobData;
    }
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return normalizeStore(JSON.parse(await fs.readFile(this.filePath, 'utf8')));
      } catch (error) {
        if (isMissingFileError(error)) {
          const initial = emptyStore();
          await this.write(initial);
          return initial;
        }
        if (attempt === 4) throw error;
        await delay(25 * (attempt + 1));
      }
    }
    return emptyStore();
  }

  async write(data: AgencyStoreData): Promise<void> {
    if (this.useNetlifyBlobs && await this.tryWriteToBlob(data)) return;
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(normalizeStore(data), null, 2));
  }

  async update(mutator: (data: AgencyStoreData) => void | Promise<void>): Promise<AgencyStoreData> {
    const run = async () => {
      const data = await this.readFromDisk();
      await mutator(data);
      await this.write(data);
      return data;
    };
    const next = this.updateChain.then(run, run);
    this.updateChain = next.catch(() => undefined);
    return next;
  }

  private async tryReadFromBlob(): Promise<AgencyStoreData | undefined> {
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore(this.blobStoreName);
      const data = await store.get(this.blobKey, { type: 'json' });
      if (!data) {
        const initial = emptyStore();
        await store.setJSON(this.blobKey, normalizeStore(initial));
        return initial;
      }
      return normalizeStore(data as Partial<AgencyStoreData>);
    } catch (error) {
      this.warnBlobFallback(error);
      return undefined;
    }
  }

  private async tryWriteToBlob(data: AgencyStoreData): Promise<boolean> {
    try {
      const { getStore } = await import('@netlify/blobs');
      const store = getStore(this.blobStoreName);
      await store.setJSON(this.blobKey, normalizeStore(data));
      return true;
    } catch (error) {
      this.warnBlobFallback(error);
      return false;
    }
  }

  private warnBlobFallback(error: unknown): void {
    if (this.warnedAboutBlobFallback) return;
    this.warnedAboutBlobFallback = true;
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Netlify Blob store unavailable; falling back to local JSON store: ${message}`);
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

function normalizeStore(data: Partial<AgencyStoreData>): AgencyStoreData {
  const base = emptyStore();
  return {
    ...base,
    ...data,
    design: {
      ...base.design,
      ...(data.design || {})
    }
  };
}

function isMissingFileError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'ENOENT');
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
