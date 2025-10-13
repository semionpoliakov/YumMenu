'use client';

import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useGenerateMenu } from '@/data-access/hooks';
import { mealTypeOptions } from '@/lib/enums';
import { stringToNumber, useZodForm } from '@/lib/forms';

const slotValueSchema = z
  .string()
  .default('0')
  .refine((value) => {
    if (value === '') return true;
    const parsed = stringToNumber(value);
    return parsed !== undefined && parsed >= 0;
  }, 'Enter a non-negative number');

const slotsSchema = z.object({
  breakfast: slotValueSchema,
  lunch: slotValueSchema,
  dinner: slotValueSchema,
  snack: slotValueSchema,
  dessert: slotValueSchema,
});

const generateSchema = z
  .object({
    name: z.string().trim().min(1, 'Required'),
    slots: slotsSchema,
  })
  .superRefine((value, ctx) => {
    const total = Object.values(value.slots).reduce((sum, current) => {
      const parsed = stringToNumber(current) ?? 0;
      return sum + parsed;
    }, 0);
    if (total <= 0) {
      ctx.addIssue({
        path: ['slots'],
        code: z.ZodIssueCode.custom,
        message: 'Add at least one slot',
      });
    }
  });

type GenerateFormValues = z.infer<typeof generateSchema>;

const defaultSlots: GenerateFormValues['slots'] = {
  breakfast: '',
  lunch: '',
  dinner: '',
  snack: '',
  dessert: '',
};

export function GenerateForm() {
  const router = useRouter();
  const generateMutation = useGenerateMenu();

  const form = useZodForm(generateSchema, {
    defaultValues: {
      name: '',
      slots: defaultSlots,
    },
  });

  const onSubmit = async (values: GenerateFormValues) => {
    const totalSlots = mealTypeOptions.reduce<Record<string, number>>((acc, option) => {
      const raw = values.slots[option.value as keyof GenerateFormValues['slots']];
      const parsed = stringToNumber(raw ?? '');
      if (parsed && parsed > 0) {
        acc[option.value] = parsed;
      }
      return acc;
    }, {});

    const result = await generateMutation.mutateAsync({
      name: values.name,
      totalSlots,
    });

    router.replace(`/checkout/${result.menu.id}`);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Menu name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Weekly menu" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Total slots</FormLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mealTypeOptions.map((option) => (
              <FormField
                key={option.value}
                control={form.control}
                name={`slots.${option.value}` as const}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground capitalize">
                      {option.label}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="1"
                        value={field.value ?? '0'}
                        onChange={(event) => field.onChange(event.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          {form.formState.errors.slots ? (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.slots.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={generateMutation.isPending}>
          {generateMutation.isPending ? 'Generating...' : 'Generate menu'}
        </Button>
      </form>
    </Form>
  );
}
