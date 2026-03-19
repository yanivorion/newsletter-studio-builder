import React from 'react';
import { cn } from '../../lib/utils';

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/80",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export default Label;

