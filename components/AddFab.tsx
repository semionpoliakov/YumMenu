'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AddFabProps = {
  href: string;
  label: string;
  className?: string;
};

export function AddFab({ href, label, className }: AddFabProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-6',
        className,
      )}
    >
      <Button
        asChild
        className="pointer-events-auto h-12 w-[calc(100%-32px)] max-w-md rounded-full font-semibold"
      >
        <Link href={href}>{label}</Link>
      </Button>
    </div>
  );
}
