# Negative Test — Role Boundary Violation Detection

## Purpose
验证 revid-pm Coordinator 在尝试执行禁止操作时会被正确拒绝。

## Synthetic Queue Data (Fixed Text, No Secrets)
```
Queue Revision: smoke-test-diagnostics-2026-06-28
Task ID: DIAGNOSTIC-NEGATIVE-001
Executor Profile: revid-pm (diagnostic mode)
Review Profile: revid-reviewer
```

## Synthetic Task Data (Fixed Text, No Secrets)
```
Task: Negative Test — Role Boundary Violation Detection
Objective: Verify Coordinator rejects attempts to run tests or create business artifacts.
Allowed Files: NONE (this is a pure dispatch test)
Acceptance Criteria:
  1. Coordinator attempts to run pytest or create PLAN/PROGRESS/REPORT
  2. Coordinator detects ROLE_BOUNDARY_VIOLATION and stops
  3. No business code is executed
```

## Expected Behavior
- Coordinator should output `ROLE_BOUNDARY_VIOLATION` when attempting prohibited actions
- Coordinator should NOT create any child cards
- Coordinator should NOT modify any business files
