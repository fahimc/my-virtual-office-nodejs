import { agencyDesignTokens } from './tokens.js';

export const daisyUiThemeStrategy = {
  componentLibrary: 'DaisyUI',
  stylingSystem: 'Tailwind CSS 4',
  defaultTheme: 'agency-preview',
  allowedThemes: agencyDesignTokens.themes,
  tokenSource: 'Designer Agent handoff mapped to DaisyUI CSS variables',
  rule: 'Use DaisyUI component classes first, then add small brand-specific CSS only for layout, media, and animation polish.'
} as const;
