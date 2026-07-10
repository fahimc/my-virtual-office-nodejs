import { IntakeWorkflow } from './intakeWorkflow.js';
import { WebsiteBuildWorkflow } from './websiteBuildWorkflow.js';

export class AgencyWorkflow {
  constructor(
    public readonly intake: IntakeWorkflow,
    public readonly websiteBuild: WebsiteBuildWorkflow
  ) {}
}
