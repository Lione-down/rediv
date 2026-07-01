#!/usr/bin/env python3
"""Idempotently deploy the Revid Hermes runtime contract patch after updates."""

from __future__ import annotations

import argparse
import base64
import gzip
from pathlib import Path
import subprocess
import sys


PATCH_PATH = (
    Path(__file__).resolve().parent
    / "patches"
    / "hermes-runtime-role-contracts.patch.gz.b64"
)
DEFAULT_HERMES_ROOT = (
    Path.home() / "AppData" / "Local" / "hermes" / "hermes-agent"
)


def git(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )


def patch_bytes(patch_path: Path) -> bytes:
    encoded = "".join(patch_path.read_text(encoding="ascii").splitlines())
    return gzip.decompress(base64.b64decode(encoded, validate=True))


def git_apply(
    root: Path, patch: bytes, *args: str
) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["git", "apply", *args, "-"],
        cwd=root,
        input=patch,
        capture_output=True,
        check=False,
    )


def classify(root: Path, patch_path: Path) -> str:
    if not root.joinpath(".git").exists():
        raise RuntimeError("HERMES_RUNTIME_ROOT_NOT_GIT_CHECKOUT")
    if not patch_path.is_file():
        raise RuntimeError("HERMES_RUNTIME_PATCH_MISSING")
    patch = patch_bytes(patch_path)
    reverse_worktree = git_apply(root, patch, "--reverse", "--check")
    reverse_index = git_apply(root, patch, "--cached", "--reverse", "--check")
    if reverse_worktree.returncode == 0 or reverse_index.returncode == 0:
        return "applied"
    if git_apply(root, patch, "--check").returncode == 0:
        return "applicable"
    raise RuntimeError("HERMES_RUNTIME_PATCH_BASE_INCOMPATIBLE")


def deploy(root: Path, patch_path: Path) -> str:
    state = classify(root, patch_path)
    if state == "applied":
        return "HERMES_RUNTIME_PATCH_ALREADY_APPLIED"
    status = git(root, "status", "--porcelain")
    if status.returncode != 0 or status.stdout.strip():
        raise RuntimeError("HERMES_RUNTIME_WORKTREE_NOT_CLEAN")
    result = git_apply(root, patch_bytes(patch_path))
    if result.returncode != 0:
        raise RuntimeError("HERMES_RUNTIME_PATCH_APPLY_FAILED")
    if classify(root, patch_path) != "applied":
        raise RuntimeError("HERMES_RUNTIME_PATCH_POSTCHECK_FAILED")
    return "HERMES_RUNTIME_PATCH_APPLIED"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hermes-root", type=Path, default=DEFAULT_HERMES_ROOT)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        if args.apply:
            print(deploy(args.hermes_root.resolve(), PATCH_PATH))
        else:
            state = classify(args.hermes_root.resolve(), PATCH_PATH)
            print(f"HERMES_RUNTIME_PATCH_{state.upper()}")
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
