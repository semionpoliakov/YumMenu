'use client';

import Link from 'next/link';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const sections: Array<{ href: string; title: string; description: string }> = [
  { href: '/ingredients', title: 'Ingredients', description: 'Library of base products' },
  { href: '/dishes', title: 'Dishes', description: 'Curate meals built from ingredients' },
  { href: '/fridge', title: 'Fridge', description: 'Track what you already have' },
  { href: '/generate', title: 'Generate', description: 'Create a new meal plan' },
  { href: '/menus', title: 'Menus', description: 'Review generated plans' },
  { href: '/shopping-lists', title: 'Shopping Lists', description: 'Plan your grocery run' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <Header title="Dashboard" className="pb-2" />
      <Separator />
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <Link key={section.href} href={section.href} className="no-underline">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>{section.description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
