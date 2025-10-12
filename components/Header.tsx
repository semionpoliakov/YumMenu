'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

type HeaderProps = {
  title: string;
  rightSlot?: ReactNode;
  className?: string;
};

export function Header({ title, rightSlot, className }: HeaderProps) {
  const router = useRouter();

  return (
    <header className={cn('flex items-center justify-between gap-2', className)}>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
      </div>
      {rightSlot ? <div className="flex shrink-0 items-center gap-2">{rightSlot}</div> : null}
    </header>
  );
}
