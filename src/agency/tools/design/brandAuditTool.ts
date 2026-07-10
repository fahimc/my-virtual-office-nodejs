import type { DesignBrief } from '../../schemas/designBrief.schema.js';
import { createBrandAudit } from './designArtifactFactory.js';
import { designTool } from './designToolFactory.js';

export const brandAuditTool = designTool('design.brand_audit', 'Audit existing website brand signals and UX issues.', (brief: DesignBrief) => createBrandAudit(brief));
