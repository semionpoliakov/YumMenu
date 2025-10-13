'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

type HeaderProps = {
  title: string;
  rightSlot?: ReactNode;
  className?: string;
  showBack?: boolean;
};

export function Header({ title, rightSlot, className, showBack = true }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldShowBack = showBack && pathname !== '/';

  return (
    <header
      className={cn(
        'grid grid-cols-[2.5rem_auto_2.5rem] items-center gap-2 text-center sm:grid-cols-[2.75rem_auto_2.75rem]',
        className,
      )}
    >
      <div className="flex justify-start">
        {shouldShowBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : null}
      </div>
      <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
      <div className="flex justify-end">{rightSlot}</div>
    </header>
  );
}
