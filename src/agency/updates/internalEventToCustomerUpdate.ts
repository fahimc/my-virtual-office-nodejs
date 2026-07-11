import type { CustomerUpdateDraft } from './customerUpdateFormatter.js';
import { formatInternalEvent } from './customerUpdateFormatter.js';

export function internalEventToCustomerUpdate(eventName: string): CustomerUpdateDraft {
  return formatInternalEvent(eventName);
}
