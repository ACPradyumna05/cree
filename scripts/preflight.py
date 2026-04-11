#!/usr/bin/env python3
"""Run a quick local quality gate before demoing or pushing.

Checks:
1) Python import/syntax sanity for core packages
2) MVP smoke tests
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PYTHON = sys.executable


def run(cmd: list[str], label: str) -> int:
    print(f"\n[preflight] {label}")
    print(f"[preflight] $ {' '.join(cmd)}")
    completed = subprocess.run(cmd, cwd=ROOT)
    if completed.returncode != 0:
        print(f"[preflight] FAILED: {label}")
        return completed.returncode
    print(f"[preflight] PASSED: {label}")
    return 0


def main() -> int:
    checks = [
        ([PYTHON, "-m", "compileall", "server", "env", "tasks", "agent", "client"], "Compile Python modules"),
        ([PYTHON, "-m", "pytest", "-q", "tests"], "Run pytest suite"),
        ([PYTHON, "test_mvp.py"], "Run MVP smoke tests"),
    ]

    for cmd, label in checks:
        code = run(cmd, label)
        if code != 0:
            return code

    print("\n[preflight] All checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
