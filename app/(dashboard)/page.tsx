'use client';

import Link from 'next/link';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';

const sections: Array<{ href: string; title: string }> = [
  { href: '/ingredients', title: 'Ingredients' },
  { href: '/dishes', title: 'Dishes' },
  { href: '/fridge', title: 'Fridge' },
  { href: '/menus', title: 'Menus' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-6">
      <Header title="YumMenu" />
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="no-underline">
            <Card>
              <CardContent className="flex h-24 items-center justify-center text-lg font-semibold">
                {section.title}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
