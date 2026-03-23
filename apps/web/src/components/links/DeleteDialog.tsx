import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  title?: string;
  description?: string;
}

export function DeleteDialog({
  open,
  onClose,
  onConfirm,
  isPending,
  title = "Delete link?",
  description = "This action cannot be undone. The short link will stop working immediately.",
}: DeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 text-sm">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={onClose}
            className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-500 text-white border-0 font-semibold"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}