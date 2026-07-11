import type { AgencyStoreData } from '../memory/memoryStore.js';

export interface CustomerIdentity {
  customerId: string;
  email?: string;
  devSession?: boolean;
}

export function assertCustomerProjectAccess(data: AgencyStoreData, identity: CustomerIdentity, projectId: string): void {
  const project = data.projects.find(item => item.id === projectId);
  if (!project) throw new Error(`Project not found: ${projectId}`);
  if (project.customerId !== identity.customerId) {
    throw new Error('Customer is not allowed to access this project');
  }
}

export function customerProjects(data: AgencyStoreData, identity: CustomerIdentity) {
  return data.projects.filter(project => project.customerId === identity.customerId);
}
