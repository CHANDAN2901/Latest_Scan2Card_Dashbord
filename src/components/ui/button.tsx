import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-[#854AE6] text-white hover:bg-[#6F33C5] focus-visible:ring-[#854AE6]',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-200',
        outline: 'border border-gray-300 text-gray-800 hover:bg-gray-50 focus-visible:ring-[#854AE6]',
        ghost: 'text-[#854AE6] hover:bg-[#F4ECFF] focus-visible:ring-transparent',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
        success: 'bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600'
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
