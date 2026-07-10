import path from 'node:path';
import { AuditLogger } from './audit/auditLog.js';
import { EventBus } from './events/eventBus.js';
import { CustomerMemory } from './memory/customerMemory.js';
import { MemoryStore } from './memory/memoryStore.js';
import { ProjectMemory } from './memory/projectMemory.js';
import { ModelRouter } from './models/modelRouter.js';
import { ApprovalService } from './approvals/approvalService.js';
import { ToolRegistry } from './tools/toolRegistry.js';
import { browserTool } from './tools/browserTool.js';
import { createCrmLookupTool } from './tools/crmTool.js';
import { deploymentTool } from './tools/deploymentTool.js';
import { emailTool } from './tools/emailTool.js';
import { createFileTool } from './tools/fileTool.js';
import { githubTool } from './tools/githubTool.js';
import { screenshotTool } from './tools/screenshotTool.js';
import { AgentRuntime } from './runtime/agentRuntime.js';
import { LocalJobQueue } from './runtime/jobQueue.js';
import { ResumeService } from './runtime/resumeService.js';
import { WorkflowRuntime } from './runtime/workflowRuntime.js';
import { receptionAgent } from './agents/receptionAgent.js';
import { briefAgent } from './agents/briefAgent.js';
import { plannerAgent } from './agents/plannerAgent.js';
import { designAgent } from './agents/designAgent.js';
import { copyAgent } from './agents/copyAgent.js';
import { builderAgent } from './agents/builderAgent.js';
import { qaAgent } from './agents/qaAgent.js';
import { deliveryAgent } from './agents/deliveryAgent.js';
import { clientSuccessAgent } from './agents/clientSuccessAgent.js';
import { IntakeWorkflow } from './workflows/intakeWorkflow.js';
import { WebsiteBuildWorkflow } from './workflows/websiteBuildWorkflow.js';
import { ApprovalWorkflow } from './workflows/approvalWorkflow.js';
import { DeploymentWorkflow } from './workflows/deploymentWorkflow.js';
import { AgencyWorkflow } from './workflows/agencyWorkflow.js';
import { buildOfficeState } from './ui-state/officeState.js';

export interface CreateAgencySystemOptions {
  dataDir: string;
  workspaceRoot: string;
}

export function createAgencySystem(options: CreateAgencySystemOptions) {
  const store = new MemoryStore(path.join(options.dataDir, 'agency-store.json'));
  const customerMemory = new CustomerMemory(store);
  const projectMemory = new ProjectMemory(store);
  const modelRouter = new ModelRouter();
  const agentRuntime = new AgentRuntime(store, modelRouter);
  const eventBus = new EventBus();
  const workflowRuntime = new WorkflowRuntime(store, eventBus);
  const auditLog = new AuditLogger(store);
  const approvalService = new ApprovalService(store);
  const toolRegistry = new ToolRegistry(approvalService, auditLog);
  const jobQueue = new LocalJobQueue();
  const resumeService = new ResumeService(workflowRuntime);

  [
    receptionAgent,
    briefAgent,
    plannerAgent,
    designAgent,
    copyAgent,
    builderAgent,
    qaAgent,
    deliveryAgent,
    clientSuccessAgent
  ].forEach(agent => agentRuntime.register(agent));

  [
    browserTool,
    createCrmLookupTool(customerMemory),
    deploymentTool,
    emailTool,
    createFileTool(options.workspaceRoot),
    githubTool,
    screenshotTool
  ].forEach(tool => toolRegistry.register(tool));

  const intakeWorkflow = new IntakeWorkflow(store, customerMemory, projectMemory, agentRuntime, workflowRuntime);
  const websiteBuildWorkflow = new WebsiteBuildWorkflow(store, projectMemory, agentRuntime, workflowRuntime);
  const approvalWorkflow = new ApprovalWorkflow(store);
  const deploymentWorkflow = new DeploymentWorkflow(projectMemory, workflowRuntime);
  const agencyWorkflow = new AgencyWorkflow(intakeWorkflow, websiteBuildWorkflow);

  return {
    store,
    customerMemory,
    projectMemory,
    modelRouter,
    agentRuntime,
    eventBus,
    workflowRuntime,
    auditLog,
    approvalService,
    toolRegistry,
    jobQueue,
    resumeService,
    intakeWorkflow,
    websiteBuildWorkflow,
    approvalWorkflow,
    deploymentWorkflow,
    agencyWorkflow,
    officeState: (projectId?: string) => buildOfficeState(store, agentRuntime, projectId)
  };
}

export type AgencySystem = ReturnType<typeof createAgencySystem>;
