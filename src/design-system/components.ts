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
  }
} as const;
