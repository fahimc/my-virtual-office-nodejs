import type { Customer, CustomerCreateInput } from '../schemas/customer.schema.js';
import { assertCustomerCreateInput } from '../schemas/customer.schema.js';
import { createId, nowIso, type MemoryStore } from './memoryStore.js';

export class CustomerMemory {
  constructor(private readonly store: MemoryStore) {}

  async findByEmail(email: string): Promise<Customer | undefined> {
    const data = await this.store.read();
    return data.customers.find(customer => customer.email.toLowerCase() === email.toLowerCase());
  }

  async create(input: CustomerCreateInput): Promise<Customer> {
    assertCustomerCreateInput(input);
    const existing = await this.findByEmail(input.email);
    if (existing) return existing;
    const timestamp = nowIso();
    const customer: Customer = {
      id: createId('customer'),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim(),
      businessName: input.businessName.trim(),
      businessType: input.businessType.trim(),
      existingWebsite: input.existingWebsite?.trim(),
      notes: input.notes?.trim(),
      brandPreferences: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await this.store.update(data => {
      data.customers.push(customer);
    });
    return customer;
  }

  async projectsForCustomer(customerId: string) {
    const data = await this.store.read();
    return data.projects.filter(project => project.customerId === customerId);
  }
}
