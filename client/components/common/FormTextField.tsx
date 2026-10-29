'use client';

import type { ComponentProps } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface FormTextFieldProps<TValues extends FieldValues>
  extends Omit<ComponentProps<typeof Input>, 'name' | 'defaultValue' | 'value' | 'onChange'> {
  control: Control<TValues>;
  name: Path<TValues>;
  label: string;
  description?: string;
}

/** shadcn `Field` + `Input` bound to a react-hook-form controller, with label, hint and error. */
export function FormTextField<TValues extends FieldValues>({
  control,
  name,
  label,
  description,
  id,
  ...inputProps
}: FormTextFieldProps<TValues>) {
  const inputId = id ?? `field-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
          <Input
            {...inputProps}
            {...field}
            id={inputId}
            aria-invalid={fieldState.invalid}
            aria-describedby={fieldState.invalid ? `${inputId}-error` : undefined}
          />
          {description && !fieldState.invalid && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError id={`${inputId}-error`} errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
