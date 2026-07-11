export const daisyComponents = {
  button: {
    primary: 'btn btn-primary rounded-full shadow-lg',
    secondary: 'btn btn-outline rounded-full',
    ghost: 'btn btn-ghost rounded-full',
    neutral: 'btn btn-neutral rounded-full'
  },
  card: {
    base: 'card bg-base-100 border border-base-300 shadow-xl',
    compact: 'card card-compact bg-base-100 border border-base-300 shadow-md',
    media: 'card image-full overflow-hidden shadow-2xl'
  },
  form: {
    input: 'input input-bordered w-full',
    textarea: 'textarea textarea-bordered w-full',
    select: 'select select-bordered w-full',
    join: 'join w-full'
  },
  feedback: {
    badge: 'badge badge-primary badge-lg',
    stat: 'stat bg-base-100 rounded-box border border-base-300',
    alert: 'alert'
  },
  heroAtoms: {
    glassSearchPanel: 'rounded-box border border-base-300 bg-base-100/95 shadow-2xl backdrop-blur with DaisyUI input and button controls',
    filterChipRail: 'flex flex-wrap gap-2 using badge badge-lg rounded-full for browsable filters',
    mediaFrame: 'rounded-box overflow-hidden shadow-2xl image or mockup-browser frame',
    metricStrip: 'DaisyUI stats or bordered three-column proof strip',
    highlightHeadlinePill: 'inline rounded-full background pill used inside large display type',
    floatingPreviewCard: 'card with media thumbnail, status label, and CTA inside hero composition',
    carouselRail: 'horizontal responsive card rail for people, products, places, or proof',
    splitPanel: 'two-column media plus color/content panel with accessible CTA group'
  }
} as const;
