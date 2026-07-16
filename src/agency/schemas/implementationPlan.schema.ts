export type BuildStrategy = 'existing_components' | 'internal_design_system' | 'approved_template' | 'component_kit' | 'tailwind_custom' | 'fully_custom';

export type WebsiteTemplate =
  | 'localBusinessTemplate'
  | 'luxuryPropertyTemplate'
  | 'saasTemplate'
  | 'ecommerceTemplate'
  | 'portfolioTemplate'
  | 'agencyTemplate'
  | 'landingPageTemplate'
  | 'customTemplate';

export type CodexTaskMode =
  | 'create_reusable_component'
  | 'adapt_existing_component'
  | 'build_page_from_template'
  | 'apply_design_tokens'
  | 'fix_qa_design_issues';

export interface UiSystemInspection {
  designSystemDetected: string;
  componentLibraryDetected: string[];
  stylingSystemDetected: string;
  reusableComponentsFound: string[];
  internalTemplatesFound: string[];
  reusableSectionsFound: string[];
  previousApprovedDesignsFound: string[];
  storybookAvailable: boolean;
  packageManagersDetected: string[];
  inspectionNotes: string[];
}

export interface ImplementationPlan {
  id: string;
  projectId: string;
  workflowRunId?: string;
  createdByAgentId: string;
  buildStrategy: BuildStrategy;
  designSystemDetected: string;
  componentLibraryDetected: string[];
  stylingSystemDetected: string;
  templateSelected: WebsiteTemplate;
  templateReason: string;
  reusableComponentsFound: string[];
  componentsToCreate: string[];
  componentsToModify: string[];
  sectionsToCreate: string[];
  designTokensToApply: string[];
  storybookAvailable: boolean;
  accessibilityStrategy: string;
  responsiveStrategy: string;
  filesToModify: string[];
  filesToAvoid: string[];
  risks: string[];
  validationCommands: string[];
  codexTaskRules: string[];
  createdAt: string;
  updatedAt: string;
}
