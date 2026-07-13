import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { AgencyStoreData } from '../memory/memoryStore.js';
import type { CustomerIdentity } from './clientPortalPermissions.js';

export class CustomerSessionService {
  resolve(req: Request, data: AgencyStoreData, projectId?: string): CustomerIdentity {
    const token = firstHeader(req.headers['x-portal-token']) || (typeof req.query.portalToken === 'string' ? req.query.portalToken : undefined);
    if (token) {
      const customerId = verifyPortalToken(token);
      if (!customerId) throw new Error('Invalid customer portal token');
      const customer = data.customers.find(item => item.id === customerId);
      if (!customer) throw new Error('Customer portal token does not match a customer');
      return { customerId, email: customer.email, devSession: false };
    }

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

  createToken(customerId: string, expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 14): string {
    const payload = Buffer.from(JSON.stringify({ customerId, expiresAt })).toString('base64url');
    const signature = sign(payload);
    return `${payload}.${signature}`;
  }
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function verifyPortalToken(token: string): string | undefined {
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { customerId?: string; expiresAt?: number };
    if (!parsed.customerId || !parsed.expiresAt || parsed.expiresAt < Date.now()) return undefined;
    return parsed.customerId;
  } catch {
    return undefined;
  }
}

function sign(payload: string): string {
  return createHmac('sha256', process.env.PORTAL_SESSION_SECRET || 'local-dev-portal-secret')
    .update(payload)
    .digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
