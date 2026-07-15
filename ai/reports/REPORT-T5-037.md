# REPORT-T5-037 - Multi-selection input role preview

- Result: `DONE - PASS`
- Date: 2026-07-15
- Baseline: `9d44a7e0aebdd895827cef8854c0ade9ac82a1b8`

## Outcome

Multi-node generation composition is now visually predictable before creation. Eligible selected sources show their exact independent prompt and reference order as `T1..Tn` and `R1..Rn`, matching the compose menu, persisted connections, generation provenance, preflight, and provider request.

## Implementation

- Extended `SelectionGenerationIntent` with ordered source entries derived only from the already validated preview command.
- Added a small dedicated Canvas overlay with fixed-screen markers and no pointer ownership or graph mutation.
- Kept prompt and reference numbering independent and preserved selection array order as the command's source order.
- Removed the preview naturally after atomic workflow insertion, allowing existing selected-generation provenance to own the persisted graph state.

## Verification

- Frontend build: PASS, 4,808 modules transformed.
- Focused selection composition and output Chromium: PASS, 10/10 after updating the expanded intent contract.
- Related input-order, preflight, remix, selection, output, and reveal Chromium: PASS, 23/23.
- Exact request evidence: image/video payloads, ordered keyframes, durable result lineage, reload, undo/redo, and no-charge failure remain stable.
- Visual inspection: PASS at 1440x900 and 920x900.
- Hygiene: PASS, scoped diff, file-size, `git diff --check`, and sensitive-path boundaries.

## Visual evidence

- `output/playwright/t5-037-selection-input-roles/mixed-selection-compose-menu-1440x900.png`
- `output/playwright/t5-037-selection-input-roles/mixed-selection-video-generation-1440x900.png`
- `output/playwright/t5-037-selection-input-roles/text-selection-compose-menu-920x900.png`

## Deferred boundaries

Speculative convergence edges, ghost target nodes, automatic execution, paid provider calls, secrets, backend behavior, and mobile editing remain outside scope.
