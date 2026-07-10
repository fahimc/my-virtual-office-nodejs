import type { CustomerMemory } from '../memory/customerMemory.js';
import type { ToolDefinition } from './toolRegistry.js';

export function createCrmLookupTool(customerMemory: CustomerMemory): ToolDefinition<{ email: string }, { found: boolean; customerId?: string }> {
  return {
    name: 'crm.lookup_customer',
    description: 'Look up a customer by email in local CRM memory.',
    inputSchema: '{ email: string }',
    outputSchema: '{ found: boolean, customerId?: string }',
    permissionLevel: 'safe',
    approvalRequired: false,
    async execute(input) {
      const customer = await customerMemory.findByEmail(input.email);
      return { found: Boolean(customer), customerId: customer?.id };
    }
  };
}
