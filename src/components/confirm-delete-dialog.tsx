'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function ConfirmDeleteDialog({
  itemName,
  itemType,
  onConfirm,
}: {
  itemName: string;
  itemType: string;
  onConfirm: () => void | Promise<void>;
}) {
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Delete ${itemType}`}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent><p>Delete {itemType}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict?.common?.confirmDeleteTitle || 'Are you sure?'}</AlertDialogTitle>
          <AlertDialogDescription>
            {dict?.common?.confirmDeleteDescription || 'This action cannot be undone.'} This will delete <span className="font-semibold">{itemName}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{dict?.common?.cancel || 'Cancel'}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
            {deleting ? (dict?.common?.saving || 'Deleting...') : (dict?.common?.yesDelete || 'Yes, Delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
