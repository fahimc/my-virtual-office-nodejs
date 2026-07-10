import type { DesignHandoff } from '../schemas/designHandoff.schema.js';

export class DesignHandoffWorkflow {
  toBuilderInput(handoff: DesignHandoff) {
    return {
      designHandoff: handoff,
      implementationNotes: handoff.implementationNotes,
      acceptanceCriteria: handoff.acceptanceCriteria
    };
  }
}
