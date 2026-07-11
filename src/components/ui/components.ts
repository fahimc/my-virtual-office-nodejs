import { daisyComponents } from '../../design-system/components.js';

export const uiComponentLibrary = {
  library: 'DaisyUI',
  primitives: {
    Button: daisyComponents.button,
    Card: daisyComponents.card,
    Input: daisyComponents.form.input,
    Textarea: daisyComponents.form.textarea,
    Select: daisyComponents.form.select,
    Badge: daisyComponents.feedback.badge,
    Modal: 'modal',
    Tabs: 'tabs tabs-box',
    Accordion: 'collapse collapse-arrow bg-base-100 border border-base-300',
    Container: 'agency-container',
    Section: 'agency-section'
  }
} as const;
