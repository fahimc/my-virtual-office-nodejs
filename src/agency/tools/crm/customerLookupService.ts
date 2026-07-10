import type { CustomerMemory } from '../../memory/customerMemory.js';

export class CustomerLookupService {
  constructor(private readonly customerMemory: CustomerMemory) {}

  lookupByEmail(email: string) {
    return this.customerMemory.findByEmail(email);
  }
}
