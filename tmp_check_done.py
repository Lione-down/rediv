import json, subprocess
result = subprocess.run(
    ['hermes', 'kanban', '--board', 'revid', 'list', '--status', 'done', '--json'],
    capture_output=True, text=True, cwd=r'D:\works\codexWorks\project_revid'
)
cards = json.loads(result.stdout)
for c in cards:
    title = c.get('title','')
    if 'rev41' in title.lower() or '41r3' in title.lower() or '7ab33875' in c.get('id',''):
        print(f"ID: {c['id']}, Title: {title[:120]}, Status: {c.get('status','')}")
