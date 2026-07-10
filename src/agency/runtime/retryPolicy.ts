export class RetryPolicy {
  constructor(private readonly maxAttempts = 2) {}

  shouldRetry(attempt: number, dangerous = false): boolean {
    return !dangerous && attempt < this.maxAttempts;
  }
}
