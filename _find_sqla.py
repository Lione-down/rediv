import sys
# Find sqlalchemy
for p in sys.path:
    sp = p + "/sqlalchemy"
    import os
    if os.path.isdir(sp):
        print(f"Found sqlalchemy in: {p}")
