"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type Project, type Stats } from "@/lib/api";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { ProjectCard } from "@/components/project-card";
import { StatsBar } from "@/components/stats-bar";
import { ConnectionStatus } from "@/components/connection-status";
import { Separator } from "@/components/ui/separator";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api.listProjects(), api.getStats()]);
      setProjects(p);
      setStats(s);
    } catch {
      // API might be offline — that's OK, ConnectionStatus handles it
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.visor_type.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">
                V.I.S.O.R.
              </h1>
              <p className="text-[11px] text-muted-foreground leading-none">
                Visual Ingestion &middot; Semantic Ops &middot; Relational Labeling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <CreateProjectDialog onCreated={refresh} />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 space-y-8">
        {/* Stats */}
        <StatsBar stats={stats} />

        <Separator />

        {/* Search + count */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
            <p className="text-sm text-muted-foreground">
              {projects.length === 0
                ? "No projects yet — create one to get started"
                : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          {projects.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl border bg-muted/40"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} onDeleted={refresh} />
            ))}
          </div>
        ) : projects.length > 0 && search ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No projects match &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Create your first project</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              A project is a pipeline that collects source files, renders them
              through a Visor, and exports labelled datasets for VLM training.
            </p>
            <div className="mt-6">
              <CreateProjectDialog onCreated={refresh} />
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-4">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>V.I.S.O.R. Framework &middot; Local Only</span>
          <span className="font-mono">127.0.0.1</span>
        </div>
      </footer>
    </div>
  );
}
