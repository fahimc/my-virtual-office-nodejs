import type { CompanyOS } from '../company/companyOS.js';

export class CodexBuildWorkflow {
  constructor(private readonly companyOS: CompanyOS) {}

  run(input: Parameters<CompanyOS['codex']['run']>[0]) {
    return this.companyOS.codex.run(input);
  }
}
