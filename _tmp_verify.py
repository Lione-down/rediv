import hashlib
import sys

files = [
    r'ai/reviews/REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV43-2026-07-07.md',
    r'ai/reports/DIAGNOSTIC-T4-002-REV43-RUNTIME-HEALTH-2026-07-07.md',
]

expected = {
    'REVIEW-T4-002-PMC-RUNTIME-ADVISORY-REV43-2026-07-07.md': '31AF4A18C27448F4F2BC599A344326B173D533848B47A051AAB5779B325DDD74',
    'DIAGNOSTIC-T4-002-REV43-RUNTIME-HEALTH-2026-07-07.md': 'E84B16F6B8E65BCCD64CCBB5B8D66DF00902FBE7E5A415F38C14AB1C544F934C',
}

all_ok = True
for fpath in files:
    fname = fpath.split('/')[-1]
    try:
        with open(fpath, 'rb') as f:
            data = f.read()
        actual = hashlib.sha256(data).hexdigest().upper()
        exp = expected.get(fname, '')
        status = 'OK' if actual == exp else f'MISMATCH (expected {exp})'
        if actual != exp:
            all_ok = False
        print(f'{fname}: {actual} — {status}')
    except FileNotFoundError:
        print(f'{fname}: FILE NOT FOUND')
        all_ok = False

print(f'\nAll SHA256s match: {all_ok}')
