#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run backend tests from a process-worker-safe entrypoint")
    parser.add_argument("tests", nargs="*", help="Optional unittest module or dotted test names")
    parser.add_argument("--failfast", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    os.chdir(BACKEND)
    sys.path.insert(0, str(BACKEND))
    loader = unittest.defaultTestLoader
    suite = (
        loader.loadTestsFromNames(args.tests)
        if args.tests
        else loader.discover(str(BACKEND / "tests"), pattern="test_*.py")
    )
    result = unittest.TextTestRunner(verbosity=1, failfast=args.failfast).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
