#!/usr/bin/env python3
"""Launch the V.I.S.O.R. API server (localhost only)."""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api.server:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
