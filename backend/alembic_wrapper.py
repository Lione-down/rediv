"""Alembic wrapper that removes conflicting hermes-agent venv from path."""
import sys
from pathlib import Path

# Remove conflicting venv paths BEFORE any imports
conflicts = [
    r"C:\Users\mkd\AppData\Local\hermes\hermes-agent\venv\Lib\site-packages",
    r"C:\Users\mkd\AppData\Local\hermes\hermes-agent\venv",
]
for c in conflicts:
    if c in sys.path:
        sys.path.remove(c)

# Now import and run alembic
from alembic.config import Config
from alembic import command

alembic_cfg = Config(r"D:\works\codexWorks\project_revid\backend\alembic.ini")
alembic_cfg.set_main_option("script_location", str(Path(r"D:\works\codexWorks\project_revid\backend\migrations").resolve()))

# Parse args: wrapper.py [command] [args...]
args = sys.argv[1:]
cmd = args[0] if args else "revision"
extra_args = args[1:]

if cmd == "upgrade":
    target = extra_args[0] if extra_args else "head"
    command.upgrade(alembic_cfg, target)
elif cmd == "downgrade":
    target = extra_args[0] if extra_args else "base"
    command.downgrade(alembic_cfg, target)
elif cmd == "current":
    command.current(alembic_cfg)
elif cmd == "history":
    command.history(alembic_cfg, *extra_args)
elif cmd == "check":
    command.check(alembic_cfg)
elif cmd == "heads":
    command.heads(alembic_cfg)
elif cmd == "revision":
    autogenerate = "--autogenerate" in extra_args or "-a" in extra_args
    message = "baseline"
    for i, a in enumerate(extra_args):
        if a in ("-m", "--message") and i + 1 < len(extra_args):
            message = extra_args[i + 1]
    command.revision(alembic_cfg, message=message, autogenerate=autogenerate)
else:
    print(f"Unknown command: {cmd}")
