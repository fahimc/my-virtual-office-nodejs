import type { SelectedDirection } from './creativeDirection.schema.js';
import type { Sitemap } from './sitemap.schema.js';
import type { Wireframe } from './wireframe.schema.js';
import type { DesignTokens } from './designTokens.schema.js';
import type { ComponentSpec } from './componentSpec.schema.js';

export interface DesignHandoff {
  projectId: string;
  selectedDirection: SelectedDirection;
  sitemap: Sitemap;
  wireframes: Wireframe;
  designTokens: DesignTokens;
  componentSpec: ComponentSpec;
  responsiveRules: string[];
  animationSpec: string[];
  assetList: string[];
  accessibilityRequirements: string[];
  implementationNotes: string[];
  acceptanceCriteria: string[];
  handoffSummary: string;
}
