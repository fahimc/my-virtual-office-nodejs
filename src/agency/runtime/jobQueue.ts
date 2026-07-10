export interface Job<TPayload = unknown> {
  id: string;
  name: string;
  payload: TPayload;
  status: 'queued' | 'running' | 'completed' | 'failed';
  error?: string;
}

export class LocalJobQueue {
  private readonly jobs = new Map<string, Job>();

  async enqueue<TPayload>(name: string, payload: TPayload, worker: (payload: TPayload) => Promise<void>): Promise<Job<TPayload>> {
    const job: Job<TPayload> = {
      id: `job-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      name,
      payload,
      status: 'queued'
    };
    this.jobs.set(job.id, job as Job);
    void this.run(job, worker);
    return job;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  private async run<TPayload>(job: Job<TPayload>, worker: (payload: TPayload) => Promise<void>): Promise<void> {
    job.status = 'running';
    try {
      await worker(job.payload);
      job.status = 'completed';
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      console.error(`[jobQueue] ${job.name} failed: ${job.error}`);
    }
  }
}
