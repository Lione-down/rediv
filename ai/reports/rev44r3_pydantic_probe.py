import os, sys, traceback, importlib.util
print('executable=', sys.executable)
print('version=', sys.version.replace('\n',' '))
print('cwd=', os.getcwd())
print('PYTHONPATH=', os.environ.get('PYTHONPATH'))
print('VIRTUAL_ENV=', os.environ.get('VIRTUAL_ENV'))
print('sys_path_start')
for p in sys.path:
    print(repr(p))
print('sys_path_end')
for name in ['pydantic','pydantic_core','pydantic_core._pydantic_core','pydantic_settings']:
    print(f'IMPORT_CHECK {name}')
    try:
        mod = __import__(name, fromlist=['*'])
        print('OK', name, 'file=', getattr(mod, '__file__', None), 'version=', getattr(mod, '__version__', None))
        spec = importlib.util.find_spec(name)
        print('SPEC', spec)
    except Exception as e:
        print('FAIL', name, type(e).__name__, str(e))
        traceback.print_exc()
