import { forwardRef, type HTMLAttributes } from 'react';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '@shared/lib/cn';

import { badgeVariants } from './variants';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, tone, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant, tone }), className)} {...props} />
  )
);

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
