export type CostEntryStatus = 'estimated' | 'actual' | 'void';

export interface CostLedgerEntry {
  id: string;
  projectId: string;
  customerId?: string;
  agentId: string;
  department: 'design' | 'engineering' | 'finance' | 'delivery' | 'ops';
  toolName: string;
  action: string;
  model?: string;
  pricingSource: string;
  pricingSourceUrl: string;
  quantity: number;
  unit: 'image' | 'token' | 'tool_call' | 'minute' | 'job';
  estimatedInputTokens?: number;
  estimatedOutputTokens?: number;
  actualInputTokens?: number;
  actualOutputTokens?: number;
  estimatedCostUsd: number;
  actualCostUsd?: number;
  status: CostEntryStatus;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCostSummary {
  projectId: string;
  estimatedCostUsd: number;
  actualCostUsd: number;
  entries: CostLedgerEntry[];
}
