import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Wand2 } from "lucide-react";
import { useCreateLink, useUpdateLink, ShortLink } from "@/hooks/useApi";

interface LinkDialogProps {
  open: boolean;
  onClose: () => void;
  editTarget?: ShortLink | null;
}

export function LinkDialog({ open, onClose, editTarget }: LinkDialogProps) {
  const isEdit = !!editTarget;

  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");

  const create = useCreateLink();
  const update = useUpdateLink(editTarget?.id ?? "");

  const isPending = create.isPending || update.isPending;
  const error = create.error || update.error;

  useEffect(() => {
    if (open) {
      setOriginalUrl(editTarget?.originalUrl ?? "");
      setShortUrl(editTarget?.shortUrl ?? "");
      create.reset();
      update.reset();
    }
  }, [open, editTarget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      update.mutate(
        { originalUrl, shortUrl },
        { onSuccess: onClose }
      );
    } else {
      create.mutate(
        { originalUrl, shortUrl: shortUrl || undefined },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold tracking-tight">
            {isEdit ? "Edit short link" : "Create short link"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <Alert className="bg-red-950/50 border-red-800/60 text-red-300 py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {(error as Error).message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-zinc-300">
              Destination URL <span className="text-red-400">*</span>
            </Label>
            <Input
              type="url"
              placeholder="https://example.com/very/long/url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              disabled={isPending}
              required
              className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-10"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-zinc-300">
                Custom slug
              </Label>
              <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                <Wand2 className="w-3 h-3" />
                Auto-generated if blank
              </span>
            </div>
            <div className="flex">
              <span className="flex items-center px-3 text-xs text-zinc-500 bg-zinc-800 border border-r-0 border-zinc-700 rounded-l-md font-mono">
                snip.ly/
              </span>
              <Input
                placeholder="my-link"
                value={shortUrl}
                onChange={(e) => setShortUrl(e.target.value.replace(/\s/g, "-").toLowerCase())}
                disabled={isPending}
                className="rounded-l-none bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-10 font-mono"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !originalUrl}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-md shadow-indigo-500/20"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {isEdit ? "Save changes" : "Create link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}