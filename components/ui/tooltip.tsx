'use client';

import {
  Content as TooltipContentPrimitive,
  Provider as TooltipProvider,
  Root as TooltipRoot,
  Trigger as TooltipTrigger,
} from '@radix-ui/react-tooltip';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Tooltip = TooltipRoot;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipContentPrimitive>,
  React.ComponentPropsWithoutRef<typeof TooltipContentPrimitive>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipContentPrimitive
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md border border-border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipContentPrimitive.displayName;

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
