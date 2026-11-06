import { FunctionsHttpError } from '@supabase/supabase-js';

// Edge Functions return { error } with a non-2xx status; show that text instead of the generic one
export const functionErrorMessage = async (error: unknown) => {
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    if (body?.error) return body.error as string;
  }
  return error instanceof Error ? error.message : 'Unknown error';
};
