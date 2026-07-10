export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  allowedTools: string[];
  memoryScope: 'customer' | 'project' | 'company' | 'none';
}
