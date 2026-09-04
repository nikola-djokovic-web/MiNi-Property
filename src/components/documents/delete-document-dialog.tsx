
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/hooks/use-translation';

export default function DeleteDocumentDialog({
  document,
  onDelete,
}: {
  document: { id: string, name: string };
  onDelete: () => void;
}) {
  const { dict } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  const deleteDescriptionTemplate = dict?.documents?.deleteDocumentDescription || "This will permanently delete {name}.";
  const [descBefore, descAfter] = deleteDescriptionTemplate.split("{name}");

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">{dict?.documents?.deleteDocument || "Delete Document"}</span>
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dict?.documents?.deleteDocument || "Delete Document"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict?.common?.confirmDeleteTitle || "Are you sure?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {dict?.common?.confirmDeleteDescription || "This action cannot be undone."} {descBefore}<span className="font-semibold">{document.name}</span>{descAfter}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{dict?.common?.cancel || "Cancel"}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
            {dict?.common?.yesDelete || "Yes, Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
