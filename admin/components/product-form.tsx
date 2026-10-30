'use client';

import { ProductInput, productSchema } from '@/lib/schemas/product';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Props = {
  defaultValues?: {
    name: string;
    price: number;
  };
  imageUrl?: string;
  submitLabel: string;
  onSave: (data: FormData) => Promise<{ error: string } | undefined>;
};

export function ProductForm({ defaultValues, onSave, submitLabel, imageUrl }: Props) {
  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultValues ?? { name: '', price: NaN },
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();

  useLayoutEffect(
    () => () => {
      if (imageInputRef?.current) {
        // form.reset() can't clear a file input: Controller passes RHF a proxy ref, not the
        // <input>, so RHF never calls the native <form>.reset(). Clear it through our own ref.
        imageInputRef.current.value = '';
      }
      setPreviewUrl(undefined);
      form.reset();
    },
    [form],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  async function onSubmit(values: ProductInput) {
    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('price', String(values.price));
    if (values.image) formData.set('image', values.image);

    const result = await onSave(formData);
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
        {(previewUrl ?? imageUrl) && (
          <Image
            src={previewUrl ?? imageUrl!}
            unoptimized={!!previewUrl}
            alt={defaultValues?.name || ''}
            width={48}
            height={48}
            className="size-12 rounded-md object-cover"
          />
        )}
        <Controller
          control={form.control}
          name="image"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="image">Image</FieldLabel>
              <Input
                ref={imageInputRef}
                id="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-invalid={fieldState.invalid}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  field.onChange(file);
                  setPreviewUrl(file ? URL.createObjectURL(file) : undefined);
                }}
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
