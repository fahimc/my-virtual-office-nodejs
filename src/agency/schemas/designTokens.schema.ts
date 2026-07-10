export interface DesignTokens {
  projectId: string;
  colours: Record<string, string>;
  typography: Record<string, string | number>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  borders: Record<string, string>;
  breakpoints: Record<string, string>;
  containers: Record<string, string>;
  zIndex: Record<string, number>;
  animation: Record<string, string>;
  exportedCssVariables: string;
  exportedTailwindTheme: string;
}
