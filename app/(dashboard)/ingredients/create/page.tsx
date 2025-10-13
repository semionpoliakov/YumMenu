'use client';

import { Header } from '@/components/Header';

import { IngredientForm } from '../_components/IngredientForm';

export default function IngredientCreatePage() {
  return (
    <div className="space-y-6">
      <Header title="New Ingredient" />
      <IngredientForm />
    </div>
  );
}
