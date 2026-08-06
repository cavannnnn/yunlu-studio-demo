#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_BIN="${YUNLU_PYTHON:-python3}"

if ! "$PYTHON_BIN" -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  echo "FastAPI dependencies are missing. Installing demo dependencies..."
  "$PYTHON_BIN" -m pip install -r "$ROOT_DIR/requirements.txt"
fi

cd "$ROOT_DIR"
"$PYTHON_BIN" backend.py
