# Smoke Test Diagnostic — Synthetic Queue/Task

## Purpose
验证 revid-pm Coordinator 在 TOOL BOUNDARY 下的 dispatch-only 能力。
不使用 T4-002 revision 或 business board。

## Synthetic Queue Data (Fixed Text, No Secrets)
```
Queue Revision: smoke-test-diagnostics-2026-06-28
Task ID: DIAGNOSTIC-SMOKE-001
Executor Profile: revid-pm (diagnostic mode)
Review Profile: revid-reviewer
```

## Synthetic Task Data (Fixed Text, No Secrets)
```
Task: Diagnostic Smoke Test — Pure Dispatch Only
Objective: Verify Coordinator can create a child card and complete dispatch.
Allowed Files: NONE (this is a pure dispatch test)
Acceptance Criteria:
  1. Coordinator creates exactly ONE child card
  2. Coordinator does NOT run any tests, build, or business verification
  3. Coordinator does NOT create PLAN/PROGRESS/REPORT files
  4. Coordinator completes within reasonable time (< 300s)
  5. Child card has correct parent link and assignee
```

## Expected Child Card
- Title: "Diagnostic Smoke Test — Pure Dispatch Verification"
- Assignee: revid-pm
- Workspace: D:/works/codexWorks/project_revid/diagnostic/smoke-test-2026-06-28
- Body: "This is a diagnostic smoke test child. No business code will be executed."
- Parents: [the Coordinator card ID]

## Timing Steps to Record
```
worker_started → queue_read_completed → task_read_completed → 
idempotency_lookup_completed → profile_validation_completed → 
child_payload_built → child_create_returned → child_verified → coordinator_completed
```

## Completion Validator
Before marking done, Coordinator must verify:
1. Created exactly ONE child card → Yes
2. Did NOT run any tests/builds → Yes
3. Did NOT create PLAN/PROGRESS/REPORT → Yes
4. Did NOT modify business code → Yes
5. If any check fails → output ROLE_BOUNDARY_VIOLATION and stop
