#!/usr/bin/env python3
"""Run alembic with MySQL and proper environment."""
import os
import sys

# Set environment variables
os.environ['REVID_USE_SQLITE'] = 'false'
os.environ['REVID_DB_PASSWORD'] = 'root123'

# Remove hermes agent paths from sys.path
sys.path = [p for p in sys.path if 'hermes' not in p.lower()]

# Add project paths
project_dir = os.path.dirname(__file__)
sys.path.insert(0, project_dir)
sys.path.insert(0, os.path.join(project_dir, 'migrations'))

# Run alembic
import alembic.command
import alembic.config

config = alembic.config.Config(os.path.join(project_dir, 'alembic.ini'))
config.set_main_option("script_location", os.path.join(project_dir, "migrations"))
alembic.command.upgrade(config, "head")
