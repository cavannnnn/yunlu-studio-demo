#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_BIN="${YUNLU_PYTHON:-python3}"

if ! "$PYTHON_BIN" -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  echo "FastAPI dependencies are missing. Install with:"
  echo "  $PYTHON_BIN -m pip install -r $ROOT_DIR/requirements.txt"
  exit 1
fi

cd "$ROOT_DIR"
"$PYTHON_BIN" backend.py
