import { cva } from 'class-variance-authority';

export const inputVariants = cva(
  'w-full rounded-md border font-medium transition hover:cursor-input focus-visible:outline-none focus-visible:ring-3 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400',
  {
    variants: {
      variant: {
        default:
          'bg-white border-gray-300 text-gray-900 focus-visible:border-brand-500 focus-visible:ring-brand-200',
        subtle:
          'bg-brand-50 border-transparent text-brand-900 focus-visible:border-brand-400 focus-visible:ring-brand-100',
      },
      size: {
        sm: 'px-3 py-2.5 text-sm',
        md: 'px-4 py-3 text-sm',
        lg: 'px-5 py-3.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);
