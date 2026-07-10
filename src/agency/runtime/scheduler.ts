export class Scheduler {
  private timers = new Map<string, NodeJS.Timeout>();

  schedule(id: string, delayMs: number, task: () => Promise<void> | void): void {
    this.cancel(id);
    this.timers.set(id, setTimeout(() => void task(), delayMs));
  }

  cancel(id: string): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
  }
}
