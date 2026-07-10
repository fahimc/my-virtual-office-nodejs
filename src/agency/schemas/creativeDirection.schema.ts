export interface CreativeDirection {
  id: string;
  projectId: string;
  name: string;
  summary: string;
  targetEmotion: string;
  brandPersonality: string[];
  bestFor: string;
  risks: string[];
  palette: Array<{ name: string; hex: string; usage: string }>;
  typography: { heading: string; body: string; scale: string; notes: string };
  layoutStyle: string;
  sectionStyle: string;
  buttonStyle: string;
  cardStyle: string;
  iconStyle: string;
  imageryStyle: string;
  animationStyle: string;
  homepageStructure: string[];
  mobileApproach: string;
  rationale: string;
}

export interface SelectedDirection {
  projectId: string;
  selectedDirectionId: string;
  reasonSelected: string;
  rejectedDirectionIds: string[];
  decisionMode: 'autonomous' | 'approval';
  approvedByUser: boolean;
  approvalId?: string;
  createdAt: string;
}
