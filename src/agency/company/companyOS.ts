import type { MemoryStore } from '../memory/memoryStore.js';
import type { ApprovalService } from '../approvals/approvalService.js';
import type { AuditLogger } from '../audit/auditLog.js';
import { AuditStore } from '../audit/auditStore.js';
import { ApprovalStore } from '../approvals/approvalStore.js';
import { ToolExecutionRuntime } from '../runtime/toolExecutionRuntime.js';
import { Scheduler } from '../runtime/scheduler.js';
import { RetryPolicy } from '../runtime/retryPolicy.js';
import { EnvSecretsProvider } from '../runtime/envSecretsProvider.js';
import { TaskBoardStore } from '../tools/taskboard/taskBoardStore.js';
import { TaskBoardService } from '../tools/taskboard/taskBoardService.js';
import { TaskAssignmentService } from '../tools/taskboard/taskAssignmentService.js';
import { TaskDependencyService } from '../tools/taskboard/taskDependencyService.js';
import { GitHubProjectSync } from '../tools/taskboard/githubProjectSync.js';
import { EmailDraftService } from '../tools/email/emailDraftService.js';
import { EmailApprovalService } from '../tools/email/emailApprovalService.js';
import { GmailProvider } from '../tools/email/gmailProvider.js';
import { ResendProvider } from '../tools/email/resendProvider.js';
import { createCompanyEmailTool } from '../tools/email/emailTool.js';
import { CodexToolService, createCodexTool } from '../tools/codex/codexTool.js';
import { codexReviewTool } from '../tools/codex/codexReviewTool.js';
import { GitHubBranchService } from '../tools/github/githubBranchService.js';
import { GitHubPullRequestService } from '../tools/github/githubPullRequestService.js';
import { GitHubIssueService } from '../tools/github/githubIssueService.js';
import { GitHubProjectService } from '../tools/github/githubProjectService.js';
import { GitHubWebhookHandler } from '../tools/github/githubWebhookHandler.js';
import { createCompanyGitHubTool } from '../tools/github/githubTool.js';
import { PreviewService } from '../tools/preview/previewService.js';
import { ScreenshotService } from '../tools/preview/screenshotService.js';
import { createPreviewTool } from '../tools/preview/previewTool.js';
import { createCompanyDeploymentTool } from '../tools/deployment/deploymentTool.js';
import { DeploymentApprovalService } from '../tools/deployment/deploymentApprovalService.js';
import { NotificationService } from '../tools/notifications/notificationService.js';
import { QuoteService } from '../tools/billing/quoteService.js';
import { InvoiceService } from '../tools/billing/invoiceService.js';
import { PaymentStatusService } from '../tools/billing/paymentStatusService.js';
import { companyConfigFromEnv } from './companyConfig.js';
import type { ToolDefinition } from '../tools/toolTypes.js';

export class CompanyOS {
  readonly config;
  readonly secrets = new EnvSecretsProvider();
  readonly auditStore: AuditStore;
  readonly approvalStore: ApprovalStore;
  readonly toolExecution: ToolExecutionRuntime;
  readonly scheduler = new Scheduler();
  readonly retryPolicy = new RetryPolicy();
  readonly taskBoardStore: TaskBoardStore;
  readonly taskBoard: TaskBoardService;
  readonly taskAssignment = new TaskAssignmentService();
  readonly taskDependencies = new TaskDependencyService();
  readonly githubProjectSync = new GitHubProjectSync();
  readonly emailDrafts: EmailDraftService;
  readonly emailApprovals: EmailApprovalService;
  readonly emailProvider;
  readonly codex: CodexToolService;
  readonly githubBranches: GitHubBranchService;
  readonly githubIssues = new GitHubIssueService();
  readonly githubPullRequests: GitHubPullRequestService;
  readonly githubProjects = new GitHubProjectService();
  readonly githubWebhooks = new GitHubWebhookHandler();
  readonly previews: PreviewService;
  readonly screenshots = new ScreenshotService();
  readonly deploymentApprovals: DeploymentApprovalService;
  readonly notifications: NotificationService;
  readonly quotes = new QuoteService();
  readonly invoices = new InvoiceService();
  readonly payments = new PaymentStatusService();
  readonly tools: ToolDefinition[];

  constructor(
    private readonly store: MemoryStore,
    approvalService: ApprovalService,
    auditLog: AuditLogger,
    workspaceRoot: string
  ) {
    this.config = companyConfigFromEnv(workspaceRoot);
    this.auditStore = new AuditStore(store);
    this.approvalStore = new ApprovalStore(store);
    this.toolExecution = new ToolExecutionRuntime(approvalService, auditLog);
    this.taskBoardStore = new TaskBoardStore(store);
    this.taskBoard = new TaskBoardService(this.taskBoardStore);
    this.emailDrafts = new EmailDraftService(store);
    this.emailApprovals = new EmailApprovalService(approvalService, this.emailDrafts);
    this.emailProvider = process.env.RESEND_API_KEY ? new ResendProvider() : new GmailProvider();
    this.codex = new CodexToolService(store);
    this.githubBranches = new GitHubBranchService(store);
    this.githubPullRequests = new GitHubPullRequestService(store);
    this.previews = new PreviewService(store);
    this.deploymentApprovals = new DeploymentApprovalService(approvalService);
    this.notifications = new NotificationService(store);
    this.tools = [
      createCompanyEmailTool(this.emailDrafts, this.emailProvider),
      createCodexTool(this.codex),
      codexReviewTool,
      createCompanyGitHubTool(this.githubBranches, this.githubPullRequests),
      createPreviewTool(this.previews),
      createCompanyDeploymentTool(store)
    ];
  }

  async state(projectId?: string) {
    const data = await this.store.read();
    return {
      tasks: data.companyTasks.filter(task => !projectId || task.projectId === projectId),
      codexTasks: data.codexTasks.filter(task => !projectId || task.projectId === projectId),
      github: {
        branches: data.githubBranches.filter(item => !projectId || item.projectId === projectId),
        pullRequests: data.githubPullRequests.filter(item => !projectId || item.projectId === projectId)
      },
      emailDrafts: data.emailDrafts.filter(item => !projectId || item.projectId === projectId),
      previews: data.previews.filter(item => !projectId || item.projectId === projectId),
      deployments: data.deployments.filter(item => !projectId || item.projectId === projectId),
      notifications: data.notifications.filter(item => !projectId || item.projectId === projectId),
      approvals: data.approvals.filter(item => !projectId || item.projectId === projectId),
      audit: data.audits.filter(item => !projectId || item.projectId === projectId).slice(-100).reverse()
    };
  }
}
