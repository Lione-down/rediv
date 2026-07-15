# TASK-T5-049 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- T5-048 persists source video ID and capture time but no current UI consumes them.
- The generic asset inspector therefore shows only type, status, position, and empty text content.
- Existing result-lineage navigation already provides safe desktop, compact drawer, and readonly locate behavior.
- The T5-048 mock stores only one returned PNG URL, so it cannot yet prove two independent frame assets.

## Direction

- Add one pure resolver as the authority for both inspector and Canvas source emphasis.
- Reuse the existing locate event path and drawer leave handoff.
- Keep derived source emphasis non-persistent and avoid synthetic typed connections.
- Upgrade the mock to retain each uploaded PNG by unique asset URL and verify byte independence.

## Units

1. Add RED resolver tests for valid and malformed captured-frame metadata.
2. Implement inspector provenance, time formatting, and source navigation.
3. Add selected-frame source emphasis through the same resolver.
4. Verify desktop, compact, readonly, repeat capture, independent assets, and ordered two-frame composition.
5. Build, run focused and related regressions, inspect evidence, synchronize state/report/pitfalls, commit, and push.

## Risks

- Rendering metadata without validating the source node would create dead or misleading links.
- Reusing generation lineage components would incorrectly imply a provider task relationship.
- Compact source navigation can reopen the context drawer unless it uses the existing one-shot suppression path.
- A shared mock URL can make multiple captured nodes display the latest frame instead of their own bytes.
