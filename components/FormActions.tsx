'use client';

import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

type FormActionsProps = {
  children: ReactNode;
  className?: string;
};

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-6">
      <div className="pointer-events-auto w-[calc(100%-32px)] max-w-md">
        <div className={cn('bg-background/95 backdrop-blur', className)}>{children}</div>
      </div>
    </div>
  );
}
