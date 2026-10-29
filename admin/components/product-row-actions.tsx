'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, MouseEvent, useTransition, useLayoutEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MoreHorizontalIcon } from 'lucide-react';
import { archiveProduct } from '@/app/(admin)/products/actions';

export function ProductRowActions({ product }: { product: { id: number; name: string } }) {
  const [archiveOpen, setArchiveOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useLayoutEffect(() => () => setArchiveOpen(false), []);

  const handleArchiveProduct = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    startTransition(async () => {
      setErrorMessage('');
      const result = await archiveProduct(product.id);
      if (result?.error) {
        setErrorMessage(result?.error);
      } else {
        setArchiveOpen(false);
      }
    });
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/products/${product.id}`}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setErrorMessage('');
              setArchiveOpen(true);
            }}
          >
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={archiveOpen} onOpenChange={(open) => !isPending && setArchiveOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive “{product.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the menu; existing orders keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {errorMessage && (
            <p role="alert" className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleArchiveProduct}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
