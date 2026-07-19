# TASK-T5-095 Plan

- State: `DONE - PASS`
- Objective: replace the T5-094 local-only composer contract with recoverable resource attachment and script-authoring behavior, then correct parity evidence.
- Baseline: `HEAD == origin/main == 789397fe15b443ee66431955766070918ca1b637`; tracked worktree clean.

## Unit 0 - Reproduce and freeze the contract defects

- Status: `completed`

1. Capture current attachment-to-node, local-only Send, one-shot capability load, and stale backend v4/frontend v5 runtime evidence without reading secrets.
2. Add RED browser coverage for composer-owned attachment, actual script-authoring Send, capability recovery, input retention, and accessible status text.
3. Confirm existing autosave/history and provider mock fixtures can support the intended path without a new backend authority.

Success gate: each reported defect has a deterministic failing assertion and a precise root cause.

## Unit 1 - Composer resource and execution contract

- Status: `completed`

1. Add resource-panel `attach` versus `insert` intent with explicit selection copy and events.
2. Keep attachments in composer state, render removable chips, and preserve focus/input when the resource panel opens and closes.
3. Add a scoped main-composer orchestrator that creates/persists the canonical script source and invokes the existing script-authoring pipeline under an explicit Send.
4. Retain recoverable source context on failure and prevent duplicate submission while active.

Success gate: attachment does not mutate the graph; Send reaches one mocked text generation and yields a canonical editable result.

## Unit 2 - Capability recovery and interaction convergence

- Status: `completed`

1. Make capability loading callable and race-safe with explicit loading/error/incompatible states.
2. Replace internal jargon with model/loading/unavailable copy and bounded manual retry in composer and script controls.
3. Refine composer geometry, hierarchy, attachment/model/mode controls, disabled states, responsive wrap, focus, and reduced-motion behavior using Revid tokens.
4. Update A10 ledger/scenario evidence to require interaction semantics.

Success gate: stale/failed capability is understandable and recoverable without reload; UI tests cover desktop/compact behavior.

## Unit 3 - Verification and delivery

- Status: `completed`

1. Run focused browser tests, related script/resource/shell regression, production build, and any affected performance/accessibility gate.
2. Perform diff, UTF-8, sensitive-path/signature, file-size, exact-stage, and HEAD-drift checks.
3. Update durable state, write REPORT only after all criteria pass, then commit and push the exact owned paths.

Success gate: repository evidence and `origin/main` agree; no real Agnes call or secret access occurred.

## Stop rules

- Stop before real/paid provider calls, secret access, destructive changes, migrations, or incompatible long-term authority changes.
- Do not represent browser fixtures or a restarted local runtime as real-provider proof.
