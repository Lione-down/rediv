# TASK-T6-005 Implementation Plan

- State: `BLOCKED`
- Verification outcome: `FAIL`
- Active unit: `None - terminal Human rejection`
- Task: [TASK-T6-005](../todo/TASK-T6-005.md).
- Progress: [TASK-T6-005-PROGRESS](TASK-T6-005-PROGRESS.md).
- Design: [REVID-T6-005-YUQUE-NODE-WORKFLOW-DESIGN](../../requirements/REVID-T6-005-YUQUE-NODE-WORKFLOW-DESIGN.md).
- Activation baseline: `main`, `HEAD == origin/main == 6ae71ef00127c141c6a4a7fed9f85521a33e303f`; tracked worktree clean and user-owned untracked paths preserved.

## Objective and success standard

Deliver the Human-authored Yuque node workflow as a clean-room, Revid-native frontend convergence. The Task is complete only when the attached-card hierarchy, node-local creation flows, focused regression, full gates, and explicit Human visual/interaction acceptance all pass.

## Architecture contract

- Use the existing Canvas card, composer, graph, generation, asset, group, history, persistence, and provider/model authorities.
- Treat the selected card as the local creation context. The Context Panel remains a deep-detail surface, not the primary authoring location.
- Reuse capability v6 for counts and structured video roles. Do not invent frontend-only state that cannot reload from canonical Canvas data.
- Keep shared visible layout authoritative for node body, attached composer, ports, hit targets, edges, toolbars, and materialized results.

## Unit sequence

### Unit 0 - Activation and reference baseline

- Status: `complete`
- Materialize Task, PLAN, PROGRESS, design specification, CURRENT, and ROADMAP.
- Bind the exact Yuque URL, 20 inspected reference images, manifest hash, clean baseline, design-system tokens, boundaries, risks, and Human gate.

### Unit 1 - Existing surface audit and RED fixtures

- Status: `complete`
- Map current text/script/storyboard/image/video paths to the reference sequence.
- Add failing component/browser proof for the continuous attached workbench, card-local loading/result states, reference chips, shared add behavior, and responsive ownership.

### Unit 2 - Shared attached workbench shell

- Status: `complete`
- Refine `CanvasCardWorkSurface` and its placement so the body, reference region, parameter footer, and submit action read as one attached card system.
- Preserve T6-003 projected geometry, pointer acquisition, logical anchors, and persisted edges.

### Unit 3 - Text and script authoring convergence

- Status: `complete`
- Keep direct in-card text editing authoritative after apply.
- Present script authoring and storyboard conversion as card-local steps with compact, honest status and existing stale-context protection.

### Unit 3R - Role-reference script start completion

- Status: `complete`
- Replace the incorrectly disabled `角色生成分镜脚本` start with a bounded Canvas-image selection flow backed by the existing script-authoring `reference_asset_ids` contract.
- Persist the chosen role reference through one typed Canvas command, preserve text-only graph ports, pass the exact durable asset IDs into script draft generation, and keep selection, undo/redo, autosave, reload, keyboard, and review-only behavior deterministic.
- Do not add a backend field, media-to-text graph edge, second asset authority, provider call, or hidden local-only selection state.
- Completion audit correction: the picker must close first on Escape, restore focus to the role-source opener after Escape or selection, and choose a left/right placement that remains inside the 920px viewport.

### Unit 2R - Authenticated LibTV correction

- Status: `complete`
- Supersede the first-pass 6px connected workbench interpretation with the Human-confirmed dual authority: Yuque screenshots for visuals, authenticated LibTV for observable interaction logic.
- Restore the fixed 660 CSS-px composer, 16 world-px detached visual gap, 16px outer radius, and no artificial connector neck.
- Make `参考` enter the existing Canvas selection/typed-connection flow. Make `@` mention only already-connected eligible assets, show an explicit empty state, and never create a connection.
- Collapse routine image controls into the observed prompt-first hierarchy and one summarized local parameter popover while preserving Revid capability values and provider/model authority.

### Unit 4 - Storyboard asset-group convergence

- Status: `complete`
- Present canonical asset groups as role, scene, and prop sections with add/remove/select and Context Panel deep edit.
- Resolve every asset card from the shot-plan group's ordered generation children and their canonical prompt nodes. Keep `shot_characters`, `shot_scene`, and the already-recognized optional `shot_props` field as the only asset-name authority.
- Apply add, remove, group-scoped rename, and selected-prompt text edits through one typed Canvas command with validation, atomic rollback, history, autosave, and document persistence. Do not add an asset database, workflow store, backend schema, or provider contract.
- Match the authenticated LibTV interaction order without copying its product identity: grouped asset cards remain the selection surface, each section exposes an add card, and selection opens a type-specific right-side editor for image placeholder, asset name, and the existing shot prompt text.
- Preserve generate-all, individual generation, partial failure, retry, identity, and standard ungroup.

### Unit 5 - Image generation convergence

- Status: `complete`
- Render source thumbnails, prompt, capability-driven count/ratio controls, pending state, result, retry, and batch siblings in the card-local hierarchy.

### Unit 6 - Video reference convergence

- Status: `complete`
- Add card-local first/last/reference selection, `@` discovery, thumbnail chips, per-reference intent, order/removal, and exact nine-entry feedback through existing structured bindings.

### Unit 7 - Responsive, accessibility, and geometry regression

- Status: `complete`
- Verify keyboard, focus, Escape, ARIA, reduced motion, readonly mobile, overflow, zoom, delayed media metadata, materialized cards, ports, paths, and shared add controls.

### Unit 8 - Full gates and Human acceptance

- Status: `blocked`
- Machine gates complete: focused and related regression, rebuild, exact-current-source browser proof, locked full backend, full Chromium, headed performance, audit, state/diff/UTF-8/hygiene checks, and fresh diff review pass.
- The Human Owner rejected the visual and interaction result on 2026-07-23. The Task is closed as `BLOCKED / FAIL`; do not continue remediation under T6-005.
- Keep the uncommitted implementation intact until T6-006 receives an explicit selective-reuse or full-removal decision.

## Verification order

1. Unit-specific RED fingerprint.
2. Smallest coherent GREEN and focused component/module/browser suite.
3. Related Canvas functional, persistence, accessibility, geometry, and interaction regression.
4. Production build before preview-backed Chromium.
5. Full locked backend, full unexcluded Chromium, headed performance, audit, state, diff, UTF-8, sensitive-path, and owned-path checks.
6. Human visual and interaction acceptance.

## Risks and mitigations

- A visual convergence could accidentally change durable generation semantics. Keep T6-004 modules and request snapshots authoritative and assert payload identity.
- An attached composer could detach paths or cover neighbor cards. Use projected visible layout and exercise zoom, compact width, overflow, and delayed media dimensions.
- Nine references can overflow the card. Use a bounded wrapping chip region with explicit count and removal actions, never silent clipping.
- Context Panel edits could compete with local card edits. Keep the card primary and use the panel only for selected asset detail.
- Reference mimicry could erase Revid identity. Use only Revid tokens, icons, wording, graph behavior, and semantic states.

## Stop conditions

- Stop for Human authorization before real/paid provider calls, secret access, destructive operations, irreversible migrations, external accounts, or incompatible contracts.
- Stop on unknown overlapping edits in an owned path.
- End every partial run with PROGRESS and CURRENT recording completed work, remaining work, exact next action, files changed, commands/results, blockers, and release conditions.
- T6-005 is terminal and non-executable. Do not create REPORT, mark `DONE / PASS`, stage, commit, push, or resume its implementation.
