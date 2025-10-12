import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

export const nonEmptyString = z.string().trim().min(1, 'Required');

export const positiveNumber = z
  .number({ invalid_type_error: 'Must be a number' })
  .positive('Must be greater than 0');

export const nonNegativeNumber = z
  .number({ invalid_type_error: 'Must be a number' })
  .min(0, 'Must be 0 or greater');

export const booleanCheckbox = z
  .boolean()
  .optional()
  .transform((value) => Boolean(value));

export const stringToNumber = (value: string) => {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const numberToString = (value: number | undefined | null) =>
  value === undefined || value === null ? '' : String(value);

export const useZodForm = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  options?: UseFormProps<z.infer<TSchema>>,
): UseFormReturn<z.infer<TSchema>> =>
  useForm<z.infer<TSchema>>({
    mode: 'onChange',
    resolver: zodResolver(schema),
    ...options,
  });
