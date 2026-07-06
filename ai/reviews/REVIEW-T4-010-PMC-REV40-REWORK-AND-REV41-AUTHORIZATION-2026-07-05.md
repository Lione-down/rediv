# PMC Review: T4-010 Revision 40 Rework and Revision 41 Authorization

## Verdict

`PMC_REWORK — REV40_RESPONSIVE_DRAWER_PROMPT_OVERLAP_AND_INTERACTION_EVIDENCE_INCOMPLETE / REV41_BOUNDED_REMEDIATION_AUTHORIZED`

Revision 40 successfully closes the inherited exact-viewport evidence gap: all three target viewports and real PNG files exist, their hashes and dimensions are consistent, the five protected Workspace files retain their baseline hashes, and a fresh PMC build plus scoped/full `git diff --check` pass. It does not satisfy T4-010 Unit B acceptance and must not enter Independent Review or HANDOFF.

## Failed Acceptance Evidence

- At `920x900`, the open bottom Inspector drawer overlaps the fixed Prompt Dock by approximately `58px`; at `375x812`, the overlap is approximately `13px`. The screenshots and reported bounding boxes independently show the failure. This violates the no-obstruction responsive acceptance criterion.
- The REPORT marks `prefers-reduced-motion` as not tested and does not provide a complete keyboard interaction trace for tabs, tools, drawer open/close and Prompt action.
- Generation loading/success/error preservation is not exercised. Failed-network evidence is absent rather than explicitly captured as zero for each interaction run.
- The no-`project_id` conclusion was reached without attempting the guarded action. Source audit shows `handleGenerate()` has no `projectId` guard and the Prompt action is disabled only when no node is selected, so the required “missing context does not trigger a dependent operation” behavior is not proven and is unsafe.
- `WorkspacePromptDock.vue` uses `<n-button>` without importing `NButton`; the preflight recorded the corresponding Vue component-resolution warning.
- `TASK-T4-010-UNIT-B-REV40-PROGRESS.md` still says build/diff are pending although the REPORT says they passed. The REPORT is therefore not fully consistent with the Executor progress artifact.

Stable failure fingerprint: `REV40_RESPONSIVE_DRAWER_PROMPT_OVERLAP_AND_INTERACTION_EVIDENCE_INCOMPLETE`.

## Fresh Read-only Verification

- Business file SHA256 values exactly match revision 40 Hard Gates.
- Evidence SHA256 values match the REPORT for all four PNG files.
- Fresh `npm run build`: exit `0`, 4634 modules transformed, Vite build completed.
- Fresh scoped and full `git diff --check`: exit `0`.
- No revision 40 Independent REVIEW or HANDOFF exists.

## Rework Decision

The failures are bounded implementation defects within the existing T4-010 contract. They require no product, schema, secret, paid-resource, destructive-operation or architecture decision. PMC authorizes one business REWORK attempt as revision 41. Revision 41 may modify only `Workspace.vue` and `WorkspacePromptDock.vue`, must preserve the other three Workspace component hashes, and must use the deployed first-class browser tools for the full exact-viewport and interaction matrix.

Revision 40 cards, runs, keys, session and artifacts are terminal historical evidence. They must not be retried, reused, overwritten or promoted into review.

## Human Decision

`NO`.
