import type { Request } from 'express';
import type { AgencyStoreData } from '../memory/memoryStore.js';
import type { CustomerIdentity } from './clientPortalPermissions.js';

export class CustomerSessionService {
  resolve(req: Request, data: AgencyStoreData, projectId?: string): CustomerIdentity {
    const headerCustomerId = firstHeader(req.headers['x-customer-id']);
    const queryCustomerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;
    const queryEmail = typeof req.query.email === 'string' ? req.query.email : undefined;
    const project = projectId ? data.projects.find(item => item.id === projectId) : undefined;
    const byEmail = queryEmail ? data.customers.find(customer => customer.email?.toLowerCase() === queryEmail.toLowerCase()) : undefined;
    const latestProject = [...data.projects].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
    const customerId = headerCustomerId || queryCustomerId || byEmail?.id || project?.customerId || latestProject?.customerId || data.customers[0]?.id;
    if (!customerId) throw new Error('No customer session is available');
    const customer = data.customers.find(item => item.id === customerId);
    return {
      customerId,
      email: customer?.email || queryEmail,
      devSession: !headerCustomerId && !queryCustomerId && !queryEmail
    };
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
