#!/usr/bin/env python3
"""Run alembic with proper path filtering."""
import sys
import os

# Remove hermes agent paths from sys.path
sys.path = [p for p in sys.path if 'hermes' not in p.lower()]

# Add project paths
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'migrations'))

# Run alembic
import alembic.command
import alembic.config

config = alembic.config.Config(os.path.join(os.path.dirname(__file__), 'alembic.ini'))
config.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "migrations"))
alembic.command.upgrade(config, "head")