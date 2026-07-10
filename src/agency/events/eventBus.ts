import type { AgencyEvent, AgencyEventHandler, AgencyEventType } from './eventTypes.js';
import { createId, nowIso } from '../memory/memoryStore.js';

export class EventBus {
  private readonly handlers = new Map<AgencyEventType, AgencyEventHandler[]>();
  private readonly history: AgencyEvent[] = [];

  on(type: AgencyEventType, handler: AgencyEventHandler): void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
  }

  async emit<TPayload>(event: Omit<AgencyEvent<TPayload>, 'id' | 'createdAt'>): Promise<AgencyEvent<TPayload>> {
    const fullEvent: AgencyEvent<TPayload> = {
      id: createId('event'),
      createdAt: nowIso(),
      ...event
    };
    this.history.push(fullEvent as AgencyEvent);
    const handlers = this.handlers.get(fullEvent.type) || [];
    await Promise.all(handlers.map(handler => handler(fullEvent as AgencyEvent<Record<string, unknown>>)));
    return fullEvent;
  }

  getHistory(): AgencyEvent[] {
    return [...this.history];
  }
}
