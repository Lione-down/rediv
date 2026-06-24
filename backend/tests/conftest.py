"""Strip hermes-agent venv from sys.path before any imports.

This ensures tests use the project's venv packages, not the
hermes-agent venv which may have incompatible versions.
"""
import sys
from pathlib import Path

# Remove conflicting hermes-agent venv paths BEFORE any test imports
for p in list(sys.path):
    if "hermes-agent" in p:
        sys.path.remove(p)

# Ensure the backend directory is first
backend_dir = str(Path(__file__).parent.parent.resolve())
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
