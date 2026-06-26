import sys
print("Python executable:", sys.executable)
print("Python version:", sys.version)
print("sys.path:")
for p in sys.path:
    print(" ", p)
