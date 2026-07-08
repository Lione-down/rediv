import hashlib
import sys

with open('ai/automation/HERMES-EXECUTION-STATUS.md', 'r', encoding='utf-8') as f:
    content = f.read()
lines = content.split('\n')
for i, line in enumerate(lines):
    if '| Action |' in line:
        print(f'Line {i+1}: {line.strip()}')
active = sum(1 for l in lines if l.startswith('## Active Queue'))
pmc = sum(1 for l in lines if l.startswith('## PMC Attention'))
print(f'Active Queue sections: {active}')
print(f'PMC Attention sections: {pmc}')
sha = hashlib.sha256(content.encode('utf-8')).hexdigest().upper()
print(f'SHA256: {sha}')
