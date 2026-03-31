#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# V.I.S.O.R. — Local Development Launcher
# Starts both the Python API and Next.js frontend
# ─────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Colors
BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[32m'
CYAN='\033[36m'
RESET='\033[0m'

echo -e "${BOLD}👁  V.I.S.O.R. — Visual Ingestion · Semantic Ops · Relational Labeling${RESET}"
echo -e "${DIM}Local-only development server${RESET}"
echo ""

# ── Install Python deps ──
echo -e "${CYAN}→ Checking Python dependencies...${RESET}"
pip3 install -q -r "$ROOT/api/requirements.txt"

# ── Install Node deps ──
echo -e "${CYAN}→ Checking Node dependencies...${RESET}"
(cd "$ROOT/frontend" && npm install --silent)

# ── Create projects dir ──
mkdir -p "$ROOT/projects"

# ── Launch API server (background) ──
echo -e "${GREEN}→ Starting API server on http://127.0.0.1:8000${RESET}"
(cd "$ROOT" && python3 -m api.run) &
API_PID=$!

# ── Launch frontend (background) ──
echo -e "${GREEN}→ Starting frontend on http://localhost:3000${RESET}"
(cd "$ROOT/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo -e "${BOLD}Dashboard:${RESET}  http://localhost:3000"
echo -e "${BOLD}API:${RESET}        http://127.0.0.1:8000/api/health"
echo -e "${DIM}Press Ctrl+C to stop both servers${RESET}"
echo ""

# ── Trap Ctrl+C to kill both ──
cleanup() {
  echo ""
  echo -e "${DIM}Shutting down...${RESET}"
  kill "$API_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$API_PID" "$FRONTEND_PID" 2>/dev/null || true
  echo -e "${GREEN}Done.${RESET}"
}
trap cleanup INT TERM

wait
