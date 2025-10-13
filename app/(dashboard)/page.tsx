'use client';

import Link from 'next/link';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const sections: Array<{ href: string; title: string }> = [
  { href: '/ingredients', title: 'Ingredients' },
  { href: '/dishes', title: 'Dishes' },
  { href: '/fridge', title: 'Fridge' },
  { href: '/menus', title: 'Menus' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-6">
      <Header title="Dashboard" />
      <Separator />
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="no-underline">
            <Card className="transition-transform hover:-translate-y-1 hover:shadow-md">
              <CardContent className="flex h-24 items-center justify-center text-lg font-semibold sm:text-xl">
                {section.title}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Button asChild size="lg" className="w-full justify-center text-base font-semibold">
        <Link href="/generate">Generate menu</Link>
      </Button>
    </div>
  );
}
