'use client';

import { useActionState } from 'react';
import { signIn } from './actions';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);
  const emailError = state?.fieldErrors?.email?.[0];
  const passwordError = state?.fieldErrors?.password?.[0];

  return (
    <div className="flex h-svh items-center justify-center">
      <form action={formAction} className="w-[350px]">
        <FieldGroup>
          <Field data-invalid={!!emailError}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              defaultValue={state?.email}
              aria-invalid={!!emailError}
              disabled={pending}
              required
            />
            <FieldError>{emailError}</FieldError>
          </Field>

          <Field data-invalid={!!passwordError}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              aria-invalid={!!passwordError}
              disabled={pending}
              required
            />
            <FieldError>{passwordError}</FieldError>
          </Field>
          {state?.error && <FieldError>{state.error}</FieldError>}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Signing in…' : 'Login'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
