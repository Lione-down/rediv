# TASK-T6-003 Implementation Plan

- State: `DONE`
- Verification outcome: `PASS`
- Active unit: none; all planned units are complete
- Task: [TASK-T6-003](../todo/TASK-T6-003.md).
- Progress: [TASK-T6-003-PROGRESS](TASK-T6-003-PROGRESS.md).
- Activation baseline: `HEAD == origin/main == b4e7e4fad26f346648946bc0cad8919a1d8944e2`; ahead/behind `0/0`; tracked worktree clean.
- Decisions: `ADR-2026-07-10-CODEX-DIRECT-DELIVERY`, `ADR-002`, `ADR-004`, and `ADR-005` remain authoritative.

## Objective and success standard

Deliver the smallest coherent units that converge Revid's Canvas card and card-to-card presentation on a freshly measured public reference while retaining current Revid contracts. Every behavior change follows RED to GREEN, focused regression, fresh diff review, and durable progress updates. Generated mockups communicate intent only; browser/runtime evidence establishes implementation truth.

## Unit sequence

### Unit 0 - Activation, reference, preview, and RED contracts

- Status: `complete`
- Materialize the Task chain and activate T6-003 as the sole implementation Task.
- Re-observe official LibTV in lawful, read-only, non-paid states and record viewport, zoom, precondition, action trace, visible measurements, timing/focus outcomes, confidence, and capture hashes.
- Generate one 1440x900 Revid static UI preview under untracked `output/t6-003/design-preview/`; record its prompt, dimensions, SHA-256, tool path, and Human decision in tracked evidence.
- Stop for Human static-frame approval before business-code changes. Do not generate the external motion preview without explicit spend authorization.
- After approval, add deterministic fixtures and RED pure/browser contracts for measured gaps.

### Unit 1 - Semantic tokens and shared card-state presentation

- Status: `complete`
- Add semantic Canvas presentation tokens and one pure card-interaction presentation resolver shared by DOM and Leafer consumers.
- Update card surfaces without serialized dimension changes; prove canonical families and lifecycle states at 17%, 36%, 100%, and 200% zoom.

### Unit 2 - Port geometry, disclosure, and target feedback

- Status: `foundation complete; fixed-anchor acquisition conclusion superseded by Unit 6C`
- Move visible ports to 20 world px while retaining the 40 CSS px acquisition contract.
- Centralize reveal/tone semantics and bind centers/hit regions to current visible geometry after layout and metadata changes.
- Prove direct/reverse drag, overlap resolution, exact landing, cancel, continuation, and keyboard alternatives.

### Unit 3 - Edge geometry, selection, and localized motion

- Status: `complete`
- Add one pure path resolver for midpoint-X forward Béziers and 132-world-px reverse tangents across persisted, draft, selected, provenance, reroute, and insertion paths.
- Normalize visible/hit widths to 2/20 CSS px, remove persistent arrows, and use 3000ms localized active flow with static reduced-motion fallback.
- Preserve selected identity, accessible labels/buttons, reroute, insertion, continuation, and focus.

### Unit 4 - Contextual interactions and compound workflows

- Status: `complete`
- Reuse the T6-002 discriminated contextual-surface state to align card disclosure, toolbar, composer, context, aggregate selection, and group feedback.
- Prove zero-mutation disclosure, atomic valid graph edits, and deterministic closure/focus through Escape, outside click, pointer cancel, deletion, Canvas switch, readonly, undo/redo, reload, stale result, and generation failure.

### Unit 5 - Visual convergence, regression, and delivery

- Status: `visual foundation complete; delivery reopened under Unit 6`
- Capture deterministic Revid evidence at 1440x900, 1366x768, 920x900, and 375x812 for the declared critical states.
- Run focused and related tests, build, full functional Chromium, axe/reduced motion, and unchanged headed 200-node/300-connection gates.
- Perform UTF-8, file-size, diff, sensitive-path, secret-signature, exact-stage, and HEAD-drift reviews.
- Move to `VERIFYING`, obtain final Human acceptance, write REPORT, synchronize durable state, commit only owned tracked paths, push, and confirm origin agreement.

### Unit 5B - Authoring hierarchy visual convergence

- Status: `complete`
- Preserve media and group external labels, but consume the existing canonical authoring-card header presentation inside script, note, and generation cards so type, title, body, and lifecycle read as one bounded hierarchy.
- Do not change serialized node width/height, current-layout geometry, ports, edge endpoints, persistence, or contextual authority.
- Establish RED pure presentation expectations first, then recapture the four-view visual scene and rerun focused/related regression before any new Human acceptance request.

### Unit 5C - Runtime composition fidelity convergence

- Status: `complete`
- Convert the remaining side-by-side gaps into measurable RED contracts: authoring cards must retain a readable header/body rhythm at fitted overview, the graph must occupy the vertical field rather than reading as one thin band, the enabled grid must remain visibly present, and selected source-attached surfaces must retain an inspectable boundary.
- Increase only current visible presentation within existing serialized dimensions; do not change node width/height persistence, graph commands, port/edge geometry authority, provider ownership, or responsive review-only behavior.
- Recapture all four declared viewports after a fresh build and rerun related/full/performance/hygiene gates without weakening visual thresholds.

### Unit 5D - Human runtime acceptance and delivery

- Status: `superseded by Human scope correction`
- The Unit 5C runtime was not accepted. Its visual and geometry work remains a foundation, but the prior completion boundary was incomplete.

### Unit 6A - Corrected card work-model contracts and RED

- Status: `complete`
- Record the Human-supplied editable LibTV project observation and audit Revid's media activation, composer placement, mode initialization, reference acquisition, generation projection, and typed connection authorities.
- Add pure and browser RED contracts for image/video/text card modes, card-local work-surface geometry, click-to-source disclosure, same-card lifecycle projection, compatible canvas-reference acquisition, and zero-mutation cancel.
- Preserve existing serialized node types and backend/provider contracts until the RED audit proves a smaller safe UI projection is insufficient.

### Unit 6B - Media card source acquisition and attached work surface

- Status: `complete`
- Make eligible media bodies keyboard/pointer actionable and disclose local-upload/project-asset choices through the existing resource ownership and contextual-surface authorities.
- Attach the image/video prompt and supported parameters below the selected card using current visible geometry; keep cancel disclosure-only and commit one atomic existing command/history outcome.

### Unit 6C - Card-local generation, text modes, and typed references

- Status: `complete`
- Project mock pending/success/failure into the originating card while retaining explicit persisted task/result lineage and user provider/model ownership.
- Add type-appropriate empty-card modes for text, image, and video; unsupported modes fail closed with visible reasons.
- Add a `从画布选择参考`-equivalent Revid interaction that exposes compatible candidates, ordered roles, deterministic cancel/return, and one atomic commit.
- Apply the Human-supplied port correction: all logical ports of one direction converge on one visible midpoint anchor, while the output `+` owns a broad CSS-stable edge acquisition band and follows the pointer along the clamped edge until leave/cancel reset.
- Preserve typed port IDs and graph/history authority underneath the shared presentation; prove zoom-once geometry, keyboard midpoint fallback, and readonly/locked/lifecycle closure before accepting the correction.

### Unit 6D - Corrected convergence, regression, and delivery

- Status: `machine foundation complete; Human rejected the visible completion boundary`
- Recapture the corrected critical states and rerun focused, related, full functional, accessibility, persistence/history, production build, and unchanged performance/hygiene gates.
- Obtain Human interaction acceptance of the corrected work model before REPORT, `DONE / PASS`, exact staging, commit, push, and origin verification.

### Unit 6E - Single materialized media-card convergence

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Replace the selected-only result concealment with one deterministic materialized-family projection: idle and selected Canvas show the source at stable media geometry while the canonical result and internal edge remain available through Graph Access.
- Project downstream result connections to the visible source card without mutating persisted nodes, connections, history, autosave, task, asset, or provider authority.
- Treat renderer nodes, version/lineage outlines, status overlays, DOM surfaces, hit targets, connections, and minimap as one projection boundary: a hidden canonical result must not leak an empty `V1` shell, while explicit Graph Access restores the requested record.
- Keep the media body bounds unchanged across selection; attach the existing media toolbar above and a separately bounded, collision-aware composer below. At the measured desktop state, the composer inner width targets approximately `1.98 ×` the image width rather than `1.00 ×`.
- Close card-reference acquisition deterministically on return, Escape, outside dismissal, readonly, reload, deletion, undo/redo, Canvas switch, generation/failure, and stale candidate identity.
- Establish RED pure/browser contracts before implementation for idle single-card presentation, selected zero-delta media bounds, no empty result shell, wide composer geometry, toolbar ownership, Escape reset, Graph Access reveal, typed edge projection, readonly, zoom, and compact failure closure.

### Unit 6F - Viewport-stable selected media toolbar

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Correct the remaining selected-state geometry mismatch exposed by the `三花小猫` reference: the official media is `319.831 CSS px`, the lower composer is `658.4 CSS px` (`2.0586 ×`), and the complete top toolbar is `901.1 CSS px` (`2.8174 ×`). Revid already satisfies the composer relationship but incorrectly reuses that `2 ×` width for the top toolbar.
- Keep the lower composer and media body unchanged. Make the top toolbar approximately `900 CSS px` independent of Canvas zoom, center it on the selected media when space permits, and clamp it to the current Canvas safe horizontal bounds when it does not.
- Preserve the existing Revid action set, disabled-state honesty, keyboard/focus behavior, collision flip, readonly hiding, contextual-surface authority, and zero graph/history/autosave mutation.
- Render concise visible labels for the professional actions so the measured `900 CSS px` surface has the same high-density contextual hierarchy as the official reference rather than becoming an empty icon strip; keep download, details, and fullscreen as compact utility icons.
- Establish RED browser geometry at `100%`, `92%`, and a constrained desktop viewport before implementation; update collision occupancy and recapture the selected materialized-card evidence after GREEN.

### Unit 6G - Continuous selected-card composer hierarchy

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Correct the remaining input-surface hierarchy mismatch visible in the Human-supplied selected `三花小猫` reference. The official surface reads as one continuous approximately `190 CSS px` creator panel with a lightweight top control band, an unboxed central prompt field, and a bottom model/parameter/action band. Revid currently reads as a nested form because modes and sources occupy two rows, the prompt is enclosed in a separate black textarea, and submission floats beside that nested field.
- Keep the existing approximately `2.06 ×` width authority, source attachment, collision placement, image/video modes, local upload, project assets, Canvas reference, prompt persistence, provider/model ownership, lifecycle feedback, disabled-state honesty, focus, readonly, and zero-mutation disclosure contracts.
- Converge only the visual hierarchy: one compact top control band, one continuous prompt region without a nested dark-card treatment, and one bottom metadata/action band with the submit control at the terminal edge. Preserve Revid graphite/violet identity rather than copying LibTV colors, wording, icons, or branding.
- Add RED browser assertions for group placement, continuous-surface styling, footer-owned submission, minimum desktop height, keyboard focus, compact clamping, readonly hiding, and zero document PATCHes before changing the component. Recapture desktop selected and compact evidence after GREEN, then rerun focused, full, performance, audit, and state gates.

### Unit 6H - External media metadata header

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Correct the remaining single-media-card chrome mismatch visible in the Human comparison: official media cards place the node label at the upper left and the decoded resolution at the upper right on one external header baseline, while Revid still renders resolution as an internal bottom-right pill over the image.
- Preserve the existing external title authority, decoded natural dimensions, aspect-ratio adoption, media viewport, image/video behavior, status and capture overlays, current layout geometry, ports, composer, accessibility label, and zero graph/history/autosave mutation.
- Move only the ready-state resolution presentation outside the clipped media viewport, align it to the media top-right header position, remove the pill material, and keep tabular numerals plus honest delayed-metadata behavior.
- Establish RED browser geometry/style at desktop, compact, and review-only boundaries before implementation. Recapture selected desktop/compact evidence and rerun focused, full, performance, audit, and state gates after GREEN.

### Unit 6I - Selected media toolbar height and action rhythm

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Correct the remaining selected-toolbar shape mismatch exposed by the Human-supplied `三花小猫` comparison. The official complete toolbar measures approximately `901.1 x 49.6 CSS px`; Revid has the correct approximately `900 CSS px` width but is only approximately `40 CSS px` high, so the contextual surface reads as a thin icon strip.
- Preserve the existing Revid action set, availability and disabled-state honesty, accessible names, focus behavior, source attachment, collision placement, viewport clamp, readonly hiding, utility authorities, and zero graph/history/autosave mutation.
- Make the toolbar approximately `50 CSS px` high independent of Canvas zoom. Place each professional action's icon and visible Chinese label on one horizontal row, retain compact icon-only utilities, and keep all content inside the `920px` constrained desktop toolbar without horizontal scrolling.
- Keep the standard selected toolbar above the external media header with an approximately `26..34 CSS px` gap to the media body. Flip below only when the actual top collision candidate cannot clear the app chrome boundary; never insert the toolbar between media and composer merely because the node uses the normal top viewport inset.
- Establish RED browser assertions across `17%`, `36%`, `100%`, and `200%` zoom plus live `1440 -> 920 -> 1440` viewport resize before implementation. Recapture selected desktop and compact evidence, inspect the real rendered surface, then rerun focused, full, performance, audit, and state gates after GREEN.

### Unit 6J - Square single-card acceptance evidence

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Strengthen the Human acceptance artifact without changing production behavior. The existing selected evidence uses a lawful `16:9` graph fixture, while the official `三花小猫` reference is an isolated `1:1` card; this content/aspect mismatch makes correct structure harder to compare visually.
- Add a deterministic browser-only square materialized-family fixture using the existing lawful mock-media route. Keep only the generation/result family in the primary scene, center the visible source card, and preserve the canonical hidden result plus Graph Access authority.
- Prove a `1024 x 1024` natural/decoded full-bleed square media, byte-identical visible media bounds before and after selection, one visible media card, zero detached result/lineage shell, toolbar/media/composer center alignment within `2 CSS px`, approximately `900 x 50 CSS px` toolbar geometry, `2.04..2.08 x` composer width, standard above-media placement, and zero document PATCHes.
- The first square capture exposed that production still uses `width: 200%; left: -50%` for the composer despite the official `658.4 / 319.831 = 2.0586 x` measurement and current documentation. Correct this one shared rule to `206%` with transform-based centering; preserve all work-surface content, height, interaction, collision, responsive, graph, and persistence authorities.
- Capture one desktop selected screenshot for direct structural comparison with the official square-card reference. Do not copy LibTV imagery, wording, branding, colors, source, or private behavior.
- Establish the precise ratio RED before the shared CSS correction. Then run the new exact test, related materialized-card regression, full Chromium, and state/diff/hygiene gates. Stop for explicit Human acceptance before REPORT, delivery, or goal completion.

### Unit 6K - Screen-space selected-card composer

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Correct Unit 6J's remaining cross-zoom mismatch. The official selected image composer is a fixed `660 x 191.6 CSS px` screen-space floating surface at 50%, approximately 82%, and 100% Canvas zoom, while the underlying node scales normally.
- Replace the attached work surface's media-relative `206%` width with a viewport-stable `660 CSS px` width. Keep it centered on the selected media and preserve the official `16 world px` node-to-composer gap as zoom changes.
- Add a RED matrix at 17%, 36%, 50%, 82%, 100%, and 200% that proves fixed screen width/height, center alignment, scaled gap, stable media bounds, zero document PATCHes, compact fit, and unchanged review-only hiding.
- Preserve all Unit 6J hierarchy, toolbar, ports, graph/history, lifecycle, accessibility, provider, and Revid identity boundaries. Recapture the isolated square and compact evidence after GREEN, rerun related regression and state/hygiene gates, then stop for explicit Human acceptance.

### Unit 6L - Selected toolbar/composer collision correction

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Correct the remaining real-runtime collision exposed after Unit 6K. At approximately `82%`, the selected media ends at `y=281.862`, the composer occupies `y=295.075..485.075`, and the current top-collision fallback places the `50px` toolbar at `y=289.962..339.962`, overlapping the composer by approximately `44.9px`.
- Preserve the normal `26px` above-media gap. If app chrome blocks that full clearance, clamp the toolbar to the top safe boundary only while retaining at least a `24px` media-body offset for the external title/metadata header plus separation. Only when that cannot fit may the toolbar move after the entire lower composer plus `8px`.
- Add the exact top-clearance browser RED before production edits. GREEN must prove pairwise toolbar/header/media/composer non-overlap whenever the safe field permits, a bounded safe-bottom fallback for oversized zoom, unchanged fixed toolbar/composer geometry, Canvas-safe placement, zero PATCHes, and unchanged standard-above behavior.
- Rebuild, remeasure the authenticated local card at approximately `82%`, recapture the corrected state, and rerun related selected-card/zoom/compact regression before renewed Human acceptance.

### Unit 6M - Desktop project-resource Escape dismissal

- Status: `implementation and machine verification complete; Human visual/interaction acceptance pending`
- Correct the final keyboard interruption gap found during the requirement-by-requirement authenticated audit. The compact `920px` resource drawer closes on Escape, while the desktop `complementary` project-resource panel remains open even when its selected `项目资产` tab owns focus.
- Keep the existing resource-panel disclosure, card-source target, project ownership, selection, Canvas document, history, asset, upload, and generation authorities unchanged. Escape is a zero-mutation dismissal that must reuse the existing close and opener-focus restoration path.
- Add the desktop RED to the existing resource keyboard-completeness browser contract before production edits. GREEN must close the focused desktop panel, restore the exact opener when it remains connected, preserve the selected card, and retain the existing compact drawer behavior.
- Rebuild and rerun the focused resource/card interaction regression, the relevant accessibility/context regression, full Chromium, and state/diff/hygiene gates before returning to Human acceptance.

### Unit 6N - Official-scale square acceptance capture

- Status: `evidence and machine verification complete; Human visual/interaction acceptance pending`
- Correct the final Human acceptance artifact rather than product behavior. The official `三花小猫` screenshot shows an approximately `213px` square media body while its toolbar/composer remain approximately `900/660 CSS px`; the existing Revid square screenshot was captured at 100% Canvas zoom with an approximately `320px` media body, so it is structurally valid but visually misleading side by side.
- Reuse the deterministic isolated square fixture at `67%` Canvas zoom, yielding an approximately `214px` media body while preserving the viewport-stable toolbar/composer rules. Do not change production geometry, content, branding, or interaction.
- Assert the matched-scale media, toolbar, composer, center alignment, scaled `16 world px` gap, stable single-card projection, and zero document PATCHes before writing the new acceptance screenshot.
- Reinspect the new artifact against the exact Human screenshot, retain the 100% artifact as cross-zoom evidence, and return both the visual verdict and machine proof to Human acceptance.

### Unit 6O - Elastic output multi-edge visual sequence

- Status: `implementation, evidence, and machine verification complete; Human visual/interaction acceptance pending`
- Historical coupling conclusion superseded by Unit 6Q. Retain this section as the defect/evidence trail; current paths and draft origin are fixed and only the outside control follows the pointer.
- Strengthen the Human interaction evidence for the originally requested LibTV behavior. The existing browser contract proves broad acquisition, pointer following, and reset, but its single follow-state screenshot does not visibly bind multiple outgoing paths to the moving `+`.
- Extend the deterministic browser fixture with one source card and two visible outgoing connections. Capture resting, in-band follow, and out-of-band reset frames from one fixed viewport clip.
- At every frame, obtain each SVG path's actual first point through `getPointAtLength(0)` plus its screen transform and require both path starts to equal the visible output-port screen point. Preserve logical port IDs and assert zero document PATCHes.
- The stronger RED exposed a real materialized-card defect: resting paths use the projected `320px` visible width, but the in-band elastic anchor recomputes X from the persisted generation node's `340px` width, detaching every following path by `20px` from the visible `+`. Correct elastic pointer-down and hover-anchor resolution to consume the same projected node as renderer ports and resting paths.
- Preserve all interaction constants, acquisition bounds, local Y clamping, logical IDs, graph/history, and persistence. The correction changes only which already-existing visible layout owns elastic X/size.

### Unit 6P - Materialized target shared-input convergence

- Status: `browser evidence and machine verification complete; Human visual/interaction acceptance pending`
- Complete the symmetric half of the Human shared-anchor requirement. Unit 6O historically proved shared source convergence before Unit 6Q separated the visual follower from fixed logical paths; Unit 6P must prove distinct prompt/media sources converge on one visible input midpoint of a materialized target card.
- Extend the deterministic browser graph with two source cards connected to the projected materialized card through different logical target port IDs. Read each actual SVG endpoint using `getPointAtLength(getTotalLength())` and its screen transform.
- Require both endpoints to equal the visible input-port screen point while retaining distinct persisted `prompt` and `media` IDs, one visible materialized card, and zero document PATCHes. Capture one fixed visual frame.
- Do not change production behavior unless the stronger RED finds a real renderer/path mismatch.

### Unit 6Q - Detached floating output control

- Status: `complete; Human accepted the current boundary and final unexcluded verification passed`
- Correct the Human-reported output-control mismatch. Revid currently pins X to the card boundary and moves only Y; the official control occupies a separate outside circular surface and follows the pointer in both axes.
- Preserve one fixed right-boundary midpoint for every logical output port, persisted outgoing path, and connection-drag origin. The floating `+` is transient feedback and must not move existing paths.
- Match the freshly measured public behavior with a CSS-stable approximately `80px` outside acquisition diameter and `30px` radial follow clamp. Keep the complete `20 world px` Revid control outside the card and reset it deterministically after leave/cancel/readonly/lock/layout/viewport invalidation.
- Add pure RED for outside-only circular acquisition, X/Y follow, radial clamp, and reset. Add browser RED proving the visible control follows the pointer while two existing paths remain converged on the fixed boundary midpoint, typed IDs remain unchanged, and document PATCH count remains zero.
- Rebuild, capture rest/follow/reset evidence, run focused and related port/connection/card regression, then rerun full Chromium, performance, state, diff, and hygiene gates before renewed Human acceptance.
- Human correction after the first GREEN requires the `+` glyph's own text-box center to equal the circular control center in resting, X/Y-following, clamped, and reset states. Browser inspection must keep both axes within `1 CSS px`; a screenshot alone is not sufficient proof.
- Do not update the protected three-axis visual baseline until the Human accepts Unit 6Q. The expected one-snapshot delta remains an explicit acceptance gate rather than an automatically approved image rewrite.
- Before Human acceptance, run the complete functional suite with exactly that protected title excluded. This must pass as one coherent run so targeted retries are not used as a substitute for broad regression evidence.

## Planned production and test surface

- Create only if the measured RED contracts require them: `canvas-card-interaction-presentation.ts`, `canvas-connection-path.ts`, and a scoped fidelity fixture/spec.
- Extend existing Canvas tokens, renderer, DOM surface layer, port/target helpers, connection layer/motion/presentation, contextual surfaces, and existing focused specs only where the fresh diff proves ownership.
- Keep production business files below 500 lines or document an existing approved aggregate-SFC exception and a concrete re-split trigger.

## Verification order

1. Unit-specific RED fingerprint and focused GREEN.
2. Related Canvas geometry/interaction/motion regression.
3. Production build and deterministic functional/accessibility Chromium.
4. Reduced-motion and unchanged headed performance gates.
5. State validator, UTF-8, file-size, diff, database-artifact, sensitive-path, and secret-signature checks.
6. Human final review, exact staged diff, HEAD drift, scoped conventional commit, push, and origin agreement.
