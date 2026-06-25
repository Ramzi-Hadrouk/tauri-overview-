'use client';
import { TextField, type TextFieldProps } from '@mui/material';
import { useId } from 'react';

export interface FormFieldProps extends Omit<TextFieldProps, 'name' | 'label' | 'error' | 'helperText'> {
  name: string;
  label: string;
  errorMessage?: string;
}

export function FormField({ name, label, errorMessage, value, onChange, slotProps, ...rest }: FormFieldProps) {
  const id = useId();
  const hasError = Boolean(errorMessage);

  return (
    <TextField
      id={`${id}-${name}`}
      name={name}
      label={label}
      fullWidth
      value={value ?? ''}
      onChange={onChange}
      error={hasError}
      helperText={errorMessage}
      slotProps={{
        ...slotProps,
        htmlInput: {
          'aria-label': label,
          ...((slotProps?.htmlInput as object | undefined) ?? {}),
        },
      }}
      {...rest}
    />
  );
}
