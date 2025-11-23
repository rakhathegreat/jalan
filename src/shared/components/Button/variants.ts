import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-colors hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600 disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        outline: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-100',
        ghost: 'text-gray-900 hover:bg-gray-200',
        danger: 'border border-red-300 text-red-600 hover:bg-red-50',
      },
      size: {
        sm: 'px-1.5 py-1.5 text-sm',
        md: 'px-2 py-2 text-base',
        lg: 'px-3 py-3 text-lg',
        full: 'w-full px-5 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
