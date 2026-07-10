export interface ComponentSpec {
  projectId: string;
  components: Array<{ name: string; purpose: string; anatomy: string[]; variants: string[] }>;
  sections: Array<{ name: string; components: string[]; contentSlots: string[] }>;
  variants: Record<string, string[]>;
  props: Record<string, string[]>;
  responsiveRules: string[];
  interactionRules: string[];
  accessibilityRules: string[];
  contentSlots: string[];
  examples: string[];
}
