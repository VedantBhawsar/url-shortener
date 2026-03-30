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
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
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
        <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account preferences</p>
      </div>

      <div className="rounded-xl border border-border bg-card/40 px-5">
        {/* Profile */}
        <Section
          title="Profile"
          description="Update your display name and email address."
        >
          <form onSubmit={handleSave} className="space-y-4">
            {updateMe.error && (
              <Alert className="bg-destructive/10 border-destructive/30 text-destructive py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {(updateMe.error as Error).message}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={updateMe.isPending}
                placeholder="Your name"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={updateMe.isPending}
                placeholder="you@example.com"
                className="h-9"
              />
            </div>
            <Button
              type="submit"
              disabled={updateMe.isPending || (!name && !email)}
              className="h-9 gap-1.5"
            >
              {updateMe.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : null}
              {saved ? "Saved!" : updateMe.isPending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Section>

        <Separator className="bg-border/80" />

        {/* Danger zone */}
        <Section
          title="Danger zone"
          description="Permanently delete your account and all associated links. This cannot be undone."
        >
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm text-destructive font-medium mb-0.5">Delete account</p>
            <p className="text-xs text-destructive/70 mb-3">
              Once deleted, all your links and analytics data will be permanently removed.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="gap-1.5 h-8"
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
