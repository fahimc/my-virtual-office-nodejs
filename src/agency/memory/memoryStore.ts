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

export interface AgencyStoreData {
  customers: Customer[];
  projects: Project[];
  tasks: AgentTask[];
  artifacts: Artifact[];
  approvals: ApprovalRequest[];
  workflows: WorkflowRun[];
  audits: AuditLog[];
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
  briefHistory: []
});

export class MemoryStore {
  constructor(private readonly filePath: string) {}

  async read(): Promise<AgencyStoreData> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      return { ...emptyStore(), ...JSON.parse(await fs.readFile(this.filePath, 'utf8')) };
    } catch {
      const initial = emptyStore();
      await this.write(initial);
      return initial;
    }
  }

  async write(data: AgencyStoreData): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async update(mutator: (data: AgencyStoreData) => void | Promise<void>): Promise<AgencyStoreData> {
    const data = await this.read();
    await mutator(data);
    await this.write(data);
    return data;
  }
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
