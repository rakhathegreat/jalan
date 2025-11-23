import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white',
        secondary: 'bg-gray-100 text-gray-800',
        destructive: 'bg-red-100 text-red-700',
        outline: 'border border-brand-200 bg-brand-50 text-brand-800',
        success: 'bg-emerald-100 text-emerald-700',
        info: 'bg-sky-100 text-sky-800',
      },
      tone: {
        solid: '',
        soft: 'bg-opacity-20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
