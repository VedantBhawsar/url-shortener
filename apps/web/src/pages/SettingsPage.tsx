import { useState, useEffect } from "react";
import { Loader2, AlertCircle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DeleteDialog } from "@/components/links/DeleteDialog";
import { useMe, useUpdateMe, useDeleteMe } from "@/hooks/useApi";

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid sm:grid-cols-[1fr_2fr] gap-6 py-6 first:pt-0">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { data: meRes } = useMe();
  const user = meRes?.data;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateMe = useUpdateMe();
  const deleteMe = useDeleteMe();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMe.mutate({ name, email }, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      },
    });
  };

  return (
    <div className="flex flex-col h-full max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Manage your account preferences</p>
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-5">
        {/* Profile */}
        <Section
          title="Profile"
          description="Update your display name and email address."
        >
          <form onSubmit={handleSave} className="space-y-4">
            {updateMe.error && (
              <Alert className="bg-red-950/40 border-red-800/60 text-red-300 py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {(updateMe.error as Error).message}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-300">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updateMe.isPending}
                placeholder="Your name"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-zinc-300">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={updateMe.isPending}
                placeholder="you@example.com"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 h-9"
              />
            </div>
            <Button
              type="submit"
              disabled={updateMe.isPending || (!name && !email)}
              className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold h-9 shadow-md shadow-indigo-500/20 gap-1.5"
            >
              {updateMe.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : null}
              {saved ? "Saved!" : updateMe.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Section>

        <Separator className="bg-zinc-800/80" />

        {/* Danger zone */}
        <Section
          title="Danger zone"
          description="Permanently delete your account and all associated links. This cannot be undone."
        >
          <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4">
            <p className="text-sm text-red-300 font-medium mb-0.5">Delete account</p>
            <p className="text-xs text-red-400/70 mb-3">
              Once deleted, all your links and analytics data will be permanently removed.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="bg-red-700 hover:bg-red-600 text-white font-semibold gap-1.5 h-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete account
            </Button>
          </div>
        </Section>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMe.mutate()}
        isPending={deleteMe.isPending}
        title="Delete your account?"
        description="This will permanently delete your account and all short links. You cannot undo this."
      />
    </div>
  );
}