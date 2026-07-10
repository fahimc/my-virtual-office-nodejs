export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  businessType: string;
  existingWebsite?: string;
  notes?: string;
  brandPreferences?: string[];
  preferredStyle?: string;
  contactPreferences?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerCreateInput {
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  businessType: string;
  existingWebsite?: string;
  notes?: string;
}

export function assertCustomerCreateInput(input: Partial<CustomerCreateInput>): asserts input is CustomerCreateInput {
  if (!input.name?.trim()) throw new Error('Customer name is required');
  if (!input.email?.trim()) throw new Error('Customer email is required');
  if (!input.businessName?.trim()) throw new Error('Business name is required');
  if (!input.businessType?.trim()) throw new Error('Business type is required');
}
