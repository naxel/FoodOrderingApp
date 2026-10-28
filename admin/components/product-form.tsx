'use client';

import { ProductInput, productSchema } from '@/lib/schemas/product';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useLayoutEffect } from 'react';

type Props = {
  defaultValues?: ProductInput;
  submitLabel: string;
  onSave: (values: ProductInput) => Promise<{ error: string } | undefined>;
};

export function ProductForm({ defaultValues, onSave, submitLabel }: Props) {
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues ?? { name: '', price: NaN },
  });

  useLayoutEffect(() => () => form.reset(), [form]);

  async function onSubmit(values: ProductInput) {
    const result = await onSave(values);
    if (result?.error) form.setError('root', { message: result.error });
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input {...field} id="name" type="text" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="price"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="price">Price</FieldLabel>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...field}
                aria-invalid={fieldState.invalid}
                value={Number.isNaN(field.value) ? '' : field.value}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
