import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListCompanies,
  useCreateCompany,
  useUpdateCompany,
  getListCompaniesQueryKey,
} from "@workspace/api-client-react";
import type { Company } from "@workspace/api-client-react";

export default function OwnerPage() {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useListCompanies({
    query: { refetchInterval: 30000, queryKey: getListCompaniesQueryKey() },
  });
  const companies: Company[] = data?.companies ?? [];

  const createMutation = useCreateCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        setNewName("");
        toast({ title: "Firma vytvořena!", className: "bg-primary text-primary-foreground border-none font-bold" });
      },
    },
  });

  const updateMutation = useUpdateCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        setEditingId(null);
      },
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ data: { name: newName.trim() } });
  };

  const handleStartEdit = (c: Company) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const handleSaveEdit = (id: number) => {
    if (!editingName.trim()) return;
    updateMutation.mutate({ id, data: { name: editingName.trim() } });
  };

  const handleToggleActive = (c: Company) => {
    updateMutation.mutate({ id: c.id, data: { active: !c.active } });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: `${label} zkopírován!`,
        className: "bg-primary text-primary-foreground border-none font-bold",
      });
    });
  };

  const origin = window.location.origin;

  return (
    <div className="min-h-[100dvh] w-full concrete-pattern font-sans text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-12 space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl md:text-5xl font-display text-primary uppercase tracking-tight leading-none">
              🏗️ Owner Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-2">Správa firem a odkazů</p>
          </div>
          <div className="text-xs text-muted-foreground/40 font-mono">
            {companies.length} {companies.length === 1 ? "firma" : "firem"}
          </div>
        </div>

        {/* Create company */}
        <div className="bg-card border border-primary/20 rounded-xl p-5">
          <h2 className="text-sm font-display uppercase tracking-widest text-muted-foreground mb-4">Přidat firmu</h2>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
              placeholder="Název firmy…"
              maxLength={80}
              className="flex-1 min-w-0 px-4 py-2.5 bg-background border border-border rounded text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors font-semibold"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
              className="px-6 py-2.5 font-display uppercase tracking-widest bg-primary text-primary-foreground rounded hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {createMutation.isPending ? "Vytváříme…" : "+ Vytvořit"}
            </button>
          </div>
        </div>

        {/* Company list */}
        <div className="bg-card border border-primary/20 rounded-xl p-5">
          <h2 className="text-sm font-display uppercase tracking-widest text-muted-foreground mb-4">
            Všechny firmy
          </h2>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-10 animate-pulse">Načítám…</p>
          ) : companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Zatím žádné firmy. Přidej první! 🏗️</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {companies.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className={`border rounded-lg p-4 transition-colors ${
                      c.active
                        ? "bg-background/60 border-border"
                        : "bg-background/20 border-border/30 opacity-60"
                    }`}
                  >
                    {/* Top row: name + status */}
                    <div className="flex items-center gap-3 flex-wrap mb-3">
                      {editingId === c.id ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            autoFocus
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(c.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            maxLength={80}
                            className="flex-1 min-w-0 px-3 py-1.5 bg-background border border-primary rounded text-foreground focus:outline-none font-bold"
                          />
                          <button
                            onClick={() => handleSaveEdit(c.id)}
                            disabled={updateMutation.isPending}
                            className="px-3 py-1.5 text-xs font-display uppercase tracking-widest bg-primary text-primary-foreground rounded hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
                          >
                            Uložit
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Zrušit
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-bold text-lg text-foreground truncate">{c.name}</span>
                          <button
                            onClick={() => handleStartEdit(c)}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
                            title="Přejmenovat"
                          >
                            ✏️
                          </button>
                        </div>
                      )}

                      <span className={`text-xs font-display uppercase tracking-widest px-2 py-1 rounded shrink-0 ${
                        c.active
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {c.active ? "Aktivní" : "Neaktivní"}
                      </span>
                    </div>

                    {/* Bottom row: links + actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyToClipboard(`${origin}/team/${c.teamId}`, "Odkaz pro hráče")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 rounded transition-colors"
                      >
                        🔗 Odkaz týmu
                      </button>
                      <button
                        onClick={() => copyToClipboard(`${origin}/team/${c.teamId}/admin`, "Admin odkaz")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display uppercase tracking-widest bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 rounded transition-colors"
                      >
                        🔐 Admin odkaz
                      </button>
                      <div className="ml-auto shrink-0">
                        <button
                          onClick={() => handleToggleActive(c)}
                          disabled={updateMutation.isPending}
                          className={`px-3 py-1.5 text-xs font-display uppercase tracking-widest rounded transition-all active:scale-95 disabled:opacity-50 ${
                            c.active
                              ? "bg-destructive/10 border border-destructive/30 text-destructive hover:bg-destructive/20"
                              : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
                          }`}
                        >
                          {c.active ? "Deaktivovat" : "Aktivovat"}
                        </button>
                      </div>
                    </div>

                    {/* Team ID */}
                    <div className="mt-2 text-xs font-mono text-muted-foreground/50">
                      ID: {c.teamId} · přidána {new Date(c.createdAt).toLocaleDateString("cs-CZ")}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-muted-foreground/30 font-mono pb-4">
          Auto-refresh každých 30 s · Stavební kvíz owner
        </div>
      </div>
      <Toaster />
    </div>
  );
}
