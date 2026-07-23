# TASK-T6-005 - Yuque-authored inline node workflow convergence

- State: `BLOCKED`
- Verification outcome: `FAIL`
- Phase: `Product V3 / Phase 6`
- Objective: converge Revid's text, script, storyboard-asset, image, and video authoring cards on the Human-authored Yuque visual workflow and the authenticated LibTV observable interaction logic while preserving Revid identity, graph authority, generation contracts, persistence, accessibility, and review-only mobile behavior.
- Dependency: `T6-004 - DONE / PASS` at activation baseline `HEAD == origin/main == 6ae71ef00127c141c6a4a7fed9f85521a33e303f`.
- Reference: [Yuque node workflow](https://www.yuque.com/yusheng-kqb5z/vgcmxa/nxdy0z1gz07cglzo), inspected read-only after Human login on 2026-07-22.
- Logic reference: [authenticated LibTV Canvas](https://www.liblib.tv/canvas?spaceId=3406579&projectId=e3d413e251cb40bf9cd8c0f52b022055), inspected read-only on 2026-07-22. Yuque screenshots own visual appearance; authenticated LibTV owns observable state transitions and interaction order.
- Design: [REVID-T6-005-YUQUE-NODE-WORKFLOW-DESIGN](../../requirements/REVID-T6-005-YUQUE-NODE-WORKFLOW-DESIGN.md).
- Plan: [TASK-T6-005-PLAN](../doing/TASK-T6-005-PLAN.md).
- Progress: [TASK-T6-005-PROGRESS](../doing/TASK-T6-005-PROGRESS.md).

## Closure decision

- On 2026-07-23, the Human Owner explicitly rejected the visual and interaction result and requested state closure.
- Machine verification remains valid evidence for the implementation that was produced, but it does not override the failed Human acceptance criterion.
- T6-005 is terminal and non-executable as `BLOCKED / FAIL`. It has no REPORT and must not be marked `DONE / PASS`, staged, committed, or pushed.
- The current uncommitted implementation is preserved without rollback or deletion until the Human Owner chooses selective reuse or full removal under T6-006.

## Product rules

1. Node names remain directly renameable from the node's upper-left label.
2. Text authoring ends as direct in-card editing. The temporary AI/manual attempt surface must not remain as a permanent lower composer after text is applied.
3. Script authoring, storyboard conversion, image generation, and video generation stay attached to the initiating card as one continuous local work surface.
4. Storyboard assets remain canonical Revid groups/cards, visually organized as role, scene, and prop sections with add, remove, select, and deep-edit entry points.
5. Generated image and video output renders in the same card body. Pending state is visible in that body, not only in a detached status panel.
6. Image output count remains capability-driven and initially supports `1, 2, 3, 4`; the control may prioritize the Yuque-observed `1, 2, 4` presets without hiding an approved capability value.
7. Video references expose first-frame, last-frame, and ordinary-reference roles under the existing universal nine-entry budget. `参考` first establishes an existing typed Canvas input; `@` then mentions only connected eligible assets inside the prompt. Thumbnail chips, ordering, removal, and per-reference intent remain keyboard accessible.
8. Every node-side add control resolves through the same Revid action authority and remains compatible with typed graph connections.

## Scope

- Replace the detached-panel visual hierarchy with a node-attached media workbench using existing Canvas authorities.
- Refine the selected-card composer, mode/source controls, parameter summary, reference thumbnails, submit action, pending/result state, and responsive behavior.
- Bring text/script/storyboard/image/video authoring into the observable Yuque sequence without copying Yuque branding, icons, copy, prompts, or assets.
- Reuse T6-004 contracts for direct text replacement, image batches, asset groups, structured video roles, partial retry, persistence, and provider/model selection.
- Add focused component/browser fixtures and visual evidence at `1440x900`, `920x900`, and `375x812`.

## Non-goals and locked boundaries

- No backend schema, migration, new provider contract, second Canvas renderer, new workflow store, asset database, generation-task authority, or AI history system unless frontend evidence proves an existing contract is insufficient and a separate Human decision is recorded.
- No real or paid provider call, secret access, user/runtime migration, destructive operation, external-account change, or incompatible long-term contract.
- Do not copy proprietary source, branding, icons, prompts, assets, or exact styling from Yuque or LibTV.
- Preserve Revid graphite-black/violet semantics, Sora typography, Vue 3, TypeScript, Leafer UI, Pinia, graph/history/autosave/recovery, provider/model authority, keyboard accessibility, and review-only mobile behavior.
- Do not reopen or weaken T6-003 geometry and T6-004 functional contracts.

## Acceptance criteria

### Visual and interaction

1. A selected creation card reads as one continuous media workbench: preview/body above, attached prompt/reference region below, then a compact model/parameter/submit footer.
2. Text, script, image, and video workflows match the Human-authored sequence and information hierarchy recorded in the design specification.
3. Result, loading, error, retry, batch, and reference states remain card-local, honest, and visually distinct without displacing Revid semantic colors.
4. Storyboard asset groups expose grouped roles/scenes/props, add/remove, card selection, and a right-side deep-edit surface without replacing the Canvas as the primary workspace.
5. Canvas reference selection and `@` mention are separate, deterministic phases: reference selection creates the existing typed input relationship, while `@` lists only already-connected eligible assets and never creates a connection. Up to nine reference chips, role assignment, order, removal, and per-image intent are usable with pointer and keyboard.
6. Shared add controls produce one deterministic action menu and preserve typed connection behavior.
7. Desktop `1440x900`, compact `920x900`, and review-only `375x812` captures have no clipping, accidental overlap, detached composer, or hidden status.

### Functional and regression

8. T6-004 direct text replacement, image batch slot identity, group generation, partial retry, structured video roles, persistence, undo/history, and provider/model selection remain unchanged.
9. Shared visible geometry still owns cards, ports, hit targets, paths, composer placement, media toolbars, and materialized results across zoom and delayed media metadata.
10. Focus, Escape, ARIA status/alerts, minimum target sizing, reduced motion, readonly behavior, and deterministic focus restoration pass focused accessibility checks.
11. No test or preview invokes a real provider. Mock-only evidence proves all generation states.
12. Focused tests, related Chromium regression, production build, full locked backend, full Chromium, headed performance, audit, project-state, diff, UTF-8, and hygiene gates pass without threshold weakening.
13. Human Owner explicitly accepts the visual and interaction result before REPORT, `DONE / PASS`, staging, commit, or push.
