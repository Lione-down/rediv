# TASK-T5-056 - Chained generation input lineage bridge

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-055 (`DONE - PASS`)
- Owner: Codex Project Lead Engineer

## Objective

Make a generated result used by a later generation visibly retain both identities: its downstream request role and its canonical upstream variant origin.

## Scope

- Resolve included result inputs in a selected generation through canonical result lineage.
- Show combined `Rn · Vn` identity on the Canvas result source while keeping ordinary uploads as `Rn`.
- Show the exact upstream generation title and variant number in the downstream generation inspector.
- Keep the downstream request role authoritative to generation context and the upstream role authoritative to result lineage.
- Verify result-to-image and result-to-video generation, reload, compact, readonly, and invalid lineage states.

## Non-goals

- Recursive full-ancestry expansion, moving ancestors during lineage arrangement, persistent labels when no relevant generation is selected, changing branch commands, or changing provider payloads.

## Acceptance criteria

- A canonical G1 result used as G2 request input resolves exact downstream `Rn` and upstream `Vn` plus G1 identity.
- The selected G2 Canvas marker reads `Rn · Vn`; ordinary asset inputs remain `Rn`.
- The G2 inspector row states `来自 <G1 title> · Vn` and retains exact source-node navigation.
- Image and video generation requests retain exact ordered image IDs and prompts.
- Reload produces the same bridge identity without document mutation.
- Inactive, ambiguous, task-mismatched, missing, duplicate, excluded, upload, and non-result inputs do not claim upstream lineage.
- Desktop, 920px compact, and 375px readonly states remain bounded, keyboard navigable, and visually quiet.

## Visual direction

- Visual thesis: one compact dual-role notation inside the existing quiet provenance vocabulary.
- Content plan: `Rn · Vn` Canvas pill and one muted `来自 G · Vn` inspector line.
- Interaction thesis: no new control; reuse source navigation, selection-scoped reveal, existing focus treatment, and zero inspection mutation.
