# T5-096 Three-axis Parity Ledger

- Ledger version: `2`
- Date: `2026-07-19`
- State: `BLOCKED` before official authenticated Canvas observation
- Authority: latest official authenticated LibTV Canvas

## Status Contract

- `MATCHED` requires visual, functional, and interaction status to all be `MATCHED`.
- A visible control or similar feature name is not parity evidence.
- Revid source/tests prove only Revid behavior. They cannot establish an official action trace.
- T5-094 evidence may guide discovery but cannot close a row.
- A Revid feature with no official counterpart becomes `EXTENSION_PRESERVED`; it is never removed to improve screenshot similarity.

## Evidence Registry

| Evidence ID | Source | Status | Boundary |
|---|---|---|---|
| `L-T5-096-OFFICIAL` | Latest official authenticated LibTV Canvas | `BLOCKED` | No supported Browser control entry is exposed in the current task. No observation or capture is claimed. |
| `R-T5-096-CURRENT` | Current Revid source and E2E inventory | `AVAILABLE` | Establishes current ownership and preservation requirements only. |

## Scenario Ledger

No scenario row exists yet. Rows may be added only from a fresh official observation that includes source URL, time, version clue, viewport, zoom, precondition, exact action trace, visible result, geometry, focus, motion, confidence, raw capture path, and SHA-256.

| ID | Official evidence | Surface/action | Visual status | Functional status | Interaction status | Revid extension status | Closure evidence |
|---|---|---|---|---|---|---|---|
| none | none | Official audit not yet possible | `PENDING` | `PENDING` | `PENDING` | `PENDING` | Browser control release condition |

## Current Counters

These values are intentionally not reported as zero. The scenario inventory is missing, so a numeric zero would falsely imply successful closure.

| Counter | Value |
|---|---|
| Official scenarios inventoried | `0` |
| `VISUAL_MISMATCH` | `NOT_COMPUTABLE` |
| `FUNCTIONAL_MISMATCH` | `NOT_COMPUTABLE` |
| `INTERACTION_MISMATCH` | `NOT_COMPUTABLE` |
| `UNOBSERVED` | `NOT_COMPUTABLE` |
| `REVID_EXTENSION_REGRESSION` | `NOT_COMPUTABLE` |

## Release Condition

Restore the supported Browser control entry, capture the authenticated official Canvas at all target viewports and applicable zooms, populate the complete scenario inventory, then derive RED tests from measured gaps. T5-096 remains blocked and business-code implementation remains prohibited until that gate passes.
