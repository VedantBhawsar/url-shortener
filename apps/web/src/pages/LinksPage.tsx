import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkCard, LinkCardSkeleton } from "@/components/links/LinkCard";
import { LinkDialog } from "@/components/links/LinkDialog";
import { DeleteDialog } from "@/components/links/DeleteDialog";
import { useLinks, useDeleteLink, useUpdateLink, ShortLink } from "@/hooks/useApi";

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
        <Link2Off className="w-6 h-6 text-zinc-500" />
      </div>
      <p className="text-zinc-300 font-semibold text-base mb-1">No short links yet</p>
      <p className="text-zinc-500 text-sm mb-6 max-w-xs">
        Create your first short link to start tracking clicks and analytics.
      </p>
      <Button
        onClick={onCreateClick}
        className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-md shadow-indigo-500/20 gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Create link
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LinksPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useLinks();
  const links = data?.data ?? [];

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ShortLink | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteLink = useDeleteLink();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const updateLink = useUpdateLink(updatingId ?? "");

  const filtered = useMemo(
    () =>
      links.filter(
        (l) =>
          l.shortUrl.toLowerCase().includes(search.toLowerCase()) ||
          l.originalUrl.toLowerCase().includes(search.toLowerCase())
      ),
    [links, search]
  );

  const handleEdit = (link: ShortLink) => {
    setEditTarget(link);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteLink.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
  };

  const handleToggleStatus = (id: string, status: boolean) => {
    setUpdatingId(id);
    updateLink.mutate({ status }, { onSettled: () => setUpdatingId(null) });
  };

  /** Navigate to analytics pre-scoped to this link */
  const handleViewAnalytics = (id: string) => {
    navigate(`/dashboard/analytics/${id}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">My Links</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {links.length} {links.length === 1 ? "link" : "links"} total
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold shadow-md shadow-indigo-500/20 gap-1.5 h-9"
        >
          <Plus className="w-4 h-4" />
          New link
        </Button>
      </div>

      {/* Search */}
      {links.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search links…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-indigo-500 h-9"
          />
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <LinkCardSkeleton key={i} />)
        ) : filtered.length === 0 && links.length === 0 ? (
          <EmptyState onCreateClick={handleCreate} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm py-16">
            No results for "{search}"
          </p>
        ) : (
          filtered.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onEdit={handleEdit}
              onDelete={setDeleteId}
              onToggleStatus={handleToggleStatus}
              onViewAnalytics={handleViewAnalytics}
              isDeleting={deleteLink.isPending && deleteId === link.id}
              isUpdating={updateLink.isPending && updatingId === link.id}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <LinkDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editTarget={editTarget}
      />
      <DeleteDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isPending={deleteLink.isPending}
      />
    </div>
  );
}