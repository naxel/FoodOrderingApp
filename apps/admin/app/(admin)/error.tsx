'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <>
      {error instanceof Error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}
      <Button variant="outline" size="sm" onClick={() => retry()}>
        Try again
      </Button>
    </>
  );
}
