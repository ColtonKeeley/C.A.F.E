"""
V.I.S.O.R. Local API Server
Bridges the Next.js frontend to the Python Visor framework.
Runs on localhost only — never exposed to the network.
"""

import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

PROJECTS_DIR = Path(__file__).resolve().parent.parent / "projects"
PROJECTS_DIR.mkdir(exist_ok=True)

app = FastAPI(title="V.I.S.O.R. API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    visor_type: str = "email"  # email | pdf | csv  (extensible)


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MANIFEST = "project.json"


def _project_path(project_id: str) -> Path:
    p = PROJECTS_DIR / project_id
    if not p.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    return p


def _read_manifest(project_id: str) -> dict:
    p = _project_path(project_id)
    with open(p / MANIFEST) as f:
        return json.load(f)


def _write_manifest(project_id: str, data: dict) -> None:
    p = _project_path(project_id)
    with open(p / MANIFEST, "w") as f:
        json.dump(data, f, indent=2, default=str)


def _count_files(project_id: str, subdir: str) -> int:
    d = PROJECTS_DIR / project_id / subdir
    if not d.exists():
        return 0
    return sum(1 for f in d.iterdir() if f.is_file())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/projects")
def list_projects():
    projects = []
    if not PROJECTS_DIR.exists():
        return projects
    for d in sorted(PROJECTS_DIR.iterdir()):
        manifest = d / MANIFEST
        if manifest.exists():
            with open(manifest) as f:
                proj = json.load(f)
            proj["file_count"] = _count_files(d.name, "source")
            proj["render_count"] = _count_files(d.name, "renders")
            projects.append(proj)
    return projects


@app.post("/api/projects", status_code=201)
def create_project(body: ProjectCreate):
    project_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc).isoformat()

    project_dir = PROJECTS_DIR / project_id
    project_dir.mkdir(parents=True)
    (project_dir / "source").mkdir()
    (project_dir / "renders").mkdir()
    (project_dir / "exports").mkdir()
    (project_dir / "labels").mkdir()

    manifest = {
        "id": project_id,
        "name": body.name,
        "description": body.description,
        "visor_type": body.visor_type,
        "status": "new",
        "created_at": now,
        "updated_at": now,
    }
    _write_manifest(project_id, manifest)
    return manifest


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    proj = _read_manifest(project_id)
    proj["file_count"] = _count_files(project_id, "source")
    proj["render_count"] = _count_files(project_id, "renders")
    proj["export_count"] = _count_files(project_id, "exports")
    proj["label_count"] = _count_files(project_id, "labels")
    return proj


@app.patch("/api/projects/{project_id}")
def update_project(project_id: str, body: ProjectUpdate):
    proj = _read_manifest(project_id)
    for field, value in body.model_dump(exclude_none=True).items():
        proj[field] = value
    proj["updated_at"] = datetime.now(timezone.utc).isoformat()
    _write_manifest(project_id, proj)
    return proj


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    p = _project_path(project_id)
    shutil.rmtree(p)
    return {"deleted": project_id}


@app.get("/api/stats")
def get_stats():
    """Dashboard-level aggregate stats."""
    total_projects = 0
    total_files = 0
    total_renders = 0
    visor_counts: dict[str, int] = {}

    if PROJECTS_DIR.exists():
        for d in PROJECTS_DIR.iterdir():
            manifest = d / MANIFEST
            if manifest.exists():
                total_projects += 1
                with open(manifest) as f:
                    proj = json.load(f)
                vt = proj.get("visor_type", "unknown")
                visor_counts[vt] = visor_counts.get(vt, 0) + 1
                total_files += _count_files(d.name, "source")
                total_renders += _count_files(d.name, "renders")

    return {
        "total_projects": total_projects,
        "total_files": total_files,
        "total_renders": total_renders,
        "visor_counts": visor_counts,
    }
