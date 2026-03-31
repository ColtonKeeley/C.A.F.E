"use client";

import type { Project } from "@/lib/api";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Image,
  MoreVertical,
  Trash2,
  FolderOpen,
  Mail,
  Table,
} from "lucide-react";

const VISOR_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5" />,
  csv: <Table className="h-5 w-5" />,
  image: <Image className="h-5 w-5" />,
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  new: "outline",
  collecting: "secondary",
  augmenting: "secondary",
  filtering: "secondary",
  exporting: "secondary",
  complete: "default",
};

interface ProjectCardProps {
  project: Project;
  onDeleted: () => void;
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const created = new Date(project.created_at);
  const relativeTime = getRelativeTime(created);

  async function handleDelete() {
    try {
      await api.deleteProject(project.id);
      onDeleted();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <Card className="group relative flex flex-col transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
      {/* Glow accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-lg bg-gradient-to-r from-primary/60 via-primary/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <CardHeader className="flex-1 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {VISOR_ICONS[project.visor_type] || <FolderOpen className="h-5 w-5" />}
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{relativeTime}</CardDescription>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                />
              }
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {project.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {project.description}
          </p>
        )}
      </CardHeader>

      <CardFooter className="pt-0 gap-2 flex-wrap">
        <Badge variant={STATUS_VARIANT[project.status] || "outline"}>
          {project.status}
        </Badge>
        <Tooltip>
          <TooltipTrigger render={<Badge variant="secondary" className="gap-1 font-mono text-xs" />}>
            <FileText className="h-3 w-3" />
            {project.file_count ?? 0}
          </TooltipTrigger>
          <TooltipContent>Source files</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Badge variant="secondary" className="gap-1 font-mono text-xs" />}>
            <Image className="h-3 w-3" />
            {project.render_count ?? 0}
          </TooltipTrigger>
          <TooltipContent>Renders</TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}
