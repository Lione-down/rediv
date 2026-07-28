# REPORT-T6-022 - Workflow-template library and configuration UI

- Task: [TASK-T6-022](../tasks/todo/TASK-T6-022.md)
- Plan: [TASK-T6-022-PLAN](../tasks/doing/TASK-T6-022-PLAN.md)
- Progress: [TASK-T6-022-PROGRESS](../tasks/doing/TASK-T6-022-PROGRESS.md)
- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-28`
- Activation baseline: `01db59d05c48cfab1d553c8dd0ea8d9b378616f4`

## Delivered

T6-022 adds one owner-scoped Template Library surface to the replacement Canvas runtime. It classifies backend
lifecycle versions into `Built-in`, `My Templates`, timestamp-derived `Recent`, and `Deprecated`; displays exact
version/lifecycle/owner/category/publish time, required slots, graph/step topology, capability requirements, viewport
contract, cost gate, and allowed/locked override facts; and exposes declared typed variables plus exact target-project
asset slots.

The feature orchestrator applies server-compatible defaults and client-side validation, computes T6-020-compatible
asset source revisions from the bounded owned asset identity/status/update fields, invalidates stale preflight state,
and requires a fresh executable provider-free preflight after explicit cost confirmation. It retains one in-memory
`client_mutation_id` only for the current confirmed attempt and writes no configuration to local or session storage.

`添加到画布` calls the existing T6-021 exact-version instantiate route and adopts its returned Canvas document
mutation through `commitScopedCanvasMutation`. This preserves the existing serialized history/autosave authority and
projects the same stable selected node in Workflow and Storyboard. No alternate graph authority or execution path was
introduced.

## Responsive and accessibility boundary

- 1440, 1366, and 920 expose the complete editable configuration and terminal instantiate action.
- 375 is review-only and exposes no preflight or instantiate action.
- Roving category tabs, associated labels/errors, visible focus, modal focus containment, Escape focus return, and
  reduced-motion duration are implemented.
- Scoped Axe found zero serious or critical violations.

Successful screenshots were inspected at all four required viewport widths under
`output/playwright/t6-022/`. They are machine browser evidence only and remain untracked. They do not constitute
Human visual/interaction acceptance; that program-level gate remains T6-027.

## TDD, regression, and build evidence

| Gate | Result |
|---|---|
| Focused RED | `6` expected absence failures at the missing `打开模板库` opener |
| Focused Template Library/configuration/accessibility/Storyboard | `6/6` passed |
| Workflow-template contract/resource/context/Storyboard regression | `25/25` passed |
| Replacement runtime shell regression | `2/2` passed |
| Frontend production build | PASS, `5,048 modules transformed` |
| Project-state validator | PASS |

The browser fixtures prove owner-scoped classification, exact source revision, missing-field fail closed, two-stage
cost confirmation, one T6-021 instantiate request, zero provider/generation endpoint calls, one canonical mutation
adoption, and stable Workflow/Storyboard identity. No real or paid provider, secret, user/production database,
migration, quota ledger, GenerationTask/job, or WorkflowRun was accessed or changed.

## Acceptance assessment

All non-deferred T6-022 acceptance criteria pass. Legacy Graph Template APIs remain separate; frozen T6-017 through
T6-021 contracts were not rewritten; T6-023 Script/Image, T6-024 Video, T6-025 WorkflowRun, T6-026 upgrade/clone/
detach, and T6-027 retirement/release remain untouched. T6-023 is the next dependency-ready Task for a new Direct
Delivery session.
