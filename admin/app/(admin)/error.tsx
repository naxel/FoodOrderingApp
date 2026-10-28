'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      {error instanceof Error ? <h1>{error.message}</h1> : null}
      <Button variant="outline" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </>
  );
}
