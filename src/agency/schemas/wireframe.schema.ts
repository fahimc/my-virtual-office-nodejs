export interface Wireframe {
  projectId: string;
  pages: string[];
  sections: Array<{ page: string; name: string; purpose: string; contentPriority: string[] }>;
  layoutBlocks: Array<{ id: string; type: string; desktop: string; mobile: string }>;
  contentPriority: string[];
  desktopLayout: string;
  tabletLayout: string;
  mobileLayout: string;
  notesForBuilder: string[];
}
