'use client';

import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';

import { GenerateForm } from './_components/GenerateForm';

export default function GeneratePage() {
  return (
    <div className="space-y-6 pb-6">
      <Header title="Generate menu" />
      <Card>
        <CardContent className="space-y-4">
          <GenerateForm />
        </CardContent>
      </Card>
    </div>
  );
}
