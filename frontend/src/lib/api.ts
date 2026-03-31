// In dev, Next.js rewrites /api/* → 127.0.0.1:8000/api/*
// so we can use relative paths and avoid CORS entirely.
const API_BASE = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  name: string;
  description: string;
  visor_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  file_count?: number;
  render_count?: number;
  export_count?: number;
  label_count?: number;
}

export interface Stats {
  total_projects: number;
  total_files: number;
  total_renders: number;
  visor_counts: Record<string, number>;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export const api = {
  health: () => request<{ status: string }>("/api/health"),
  getStats: () => request<Stats>("/api/stats"),
  listProjects: () => request<Project[]>("/api/projects"),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  createProject: (data: { name: string; description?: string; visor_type?: string }) =>
    request<Project>("/api/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request<{ deleted: string }>(`/api/projects/${id}`, { method: "DELETE" }),
};
