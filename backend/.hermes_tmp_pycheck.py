import sys
print(f"Python: {sys.executable}")
print(f"Version: {sys.version}")
try:
    import sqlalchemy
    print(f"SQLAlchemy: {sqlalchemy.__version__}")
except ImportError:
    print("SQLAlchemy: NOT FOUND")
