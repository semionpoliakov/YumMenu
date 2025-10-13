'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type HeaderProps = {
  title: string;
  rightSlot?: ReactNode;
  className?: string;
  showBack?: boolean;
};

export function Header({ title, rightSlot, className, showBack = true }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const fallbackHref = useMemo(() => {
    if (!pathname || pathname === '/') return '/';
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return '/';
    return `/${segments.slice(0, -1).join('/')}`;
  }, [pathname]);

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  };
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
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : null}
      </div>
      <h1 className="font-semibold text-xl">{title}</h1>
      <div className="flex justify-end">{rightSlot}</div>
    </header>
  );
}
