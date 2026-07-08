import hashlib, sys, datetime
f = "ai/automation/HERMES-EXECUTION-STATUS.md"
h = hashlib.sha256(open(f,'rb').read()).hexdigest().upper()
print(f"SHA256: {h}")
now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).strftime("%Y-%m-%dT%H:%M:%S+08:00")
print(f"Now: {now}")
