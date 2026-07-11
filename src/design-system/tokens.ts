export const agencyDesignTokens = {
  themes: ['agency-preview', 'corporate', 'cupcake', 'lemonade', 'garden', 'emerald', 'winter', 'sunset'],
  colors: {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
    neutral: 'var(--color-neutral)',
    base: 'var(--color-base-100)',
    content: 'var(--color-base-content)'
  },
  typography: {
    display: 'font-black tracking-normal leading-none',
    heading: 'font-extrabold tracking-normal leading-tight',
    body: 'font-medium leading-relaxed',
    label: 'font-bold tracking-normal'
  },
  radius: {
    control: 'rounded-full',
    card: 'rounded-box',
    media: 'rounded-[2rem]'
  },
  motion: {
    reveal: 'agency-rise-in',
    image: 'agency-slow-zoom',
    product: 'agency-float'
  }
} as const;
