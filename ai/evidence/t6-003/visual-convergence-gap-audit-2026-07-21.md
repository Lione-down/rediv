# T6-003 Runtime Visual-Convergence Gap Audit - 2026-07-21

- State: `READY_FOR_HUMAN_REVIEW`.
- Trigger: Human review `目前的效果和你提供的Ui图不一样吧？你觉得这样就可以了？`.
- Verdict: `REJECTED`. The prior 1440x900 runtime capture proves mechanical card/edge contracts but does not faithfully realize the approved UI direction.
- Approved frame: `output/t6-003/design-preview/revid-canvas-card-interaction-static-v1-1440x900.png`, SHA-256 `D2881B12B17B5653AFDCE5EA6D09A257F00C44EFE9B1EB94CACD343A81BC9A1F`.
- Rejected runtime frame: `output/playwright/t6-003-card-interaction/desktop-1440x900.png`, SHA-256 `7FCF576C8D60F9D177A1583519C769E4F143401A23880946E8E2F4B3E58E01A8`.

## Direct comparison

| Surface | Approved direction | Rejected runtime | Severity |
|---|---|---|---|
| Primary composition | Dense, readable left-to-right creative graph fills the central Canvas with multiple authoring/media/generation/result families. | Only a small partial lineage is visible; upstream nodes are clipped and most of the Canvas is empty. | `BLOCKING` |
| Selected-media focus | A cinematic image is the unmistakable focal card, with restrained violet selection and surrounding graph context. | The selected card is a monochrome diagnostic placeholder; its size dominates a sparse scene without meaningful visual content. | `BLOCKING` |
| Contextual composition | Compact toolbar is attached above and a compact continuation/composer surface is attached below the selected media. | Toolbar is present, but a large right Graph Access panel competes for attention and no below-source continuation surface is visible. | `BLOCKING` |
| Card hierarchy | Compact authoring cards, media cards, generation, and result are simultaneously legible at one useful overview scale. | The capture centers one 320x180 card at 100%, leaving only fragments of neighboring families. | `HIGH` |
| Edge hierarchy | Idle edges are quiet; one localized violet active segment guides direction while preserving graph legibility. | No arrows and widths are correct, but the sparse scene cannot establish the intended passive-versus-active hierarchy across a real graph. | `HIGH` |
| Product chrome | Canvas remains the primary surface; controls are visually secondary and do not displace the graph. | Graph Access consumes roughly one quarter of the width and bottom controls are visually disconnected across the empty stage. | `HIGH` |
| Revid boundaries | Revid identity and real supported actions; no copied branding or fake provider controls. | Revid identity is retained, but the evidence scenario uses diagnostic placeholders and a navigation path that is not the approved primary state. | `MEDIUM` |

## What remains valid

- Graphite/violet identity, `12px` media radius, selected `1.5px` outline/shadow, `20 world px` ports, exact `40 CSS px` acquisition, no persistent arrows, path authority, localized flow contract, reduced motion, readonly synchronization, persistence, and performance evidence remain useful and must not regress.
- The static frame is design intent, not permission to fabricate controls. Runtime convergence must reuse actual Revid capabilities, commands, ownership checks, and accessibility contracts.

## Corrective visual contract

The next 1440x900 primary acceptance capture must satisfy all of the following in one deterministic, zero-provider-call scene:

1. At least eight non-group nodes spanning authoring, note, media, generation, and result families are simultaneously visible and readable; no declared critical node is clipped by the stage or side chrome.
2. The graph occupies the central visual field with bounded margins; the screenshot cannot be mostly empty Canvas.
3. Exactly one image media/result node is selected and renders representative lawful mock imagery rather than a solid diagnostic placeholder.
4. The selected node keeps the accepted violet state and current-boundary ports without translation, scale, or endpoint drift.
5. A compact real Revid media toolbar attaches above the selected source, and a compact real continuation surface attaches below it using existing result-branch authority; disclosure causes zero mutation.
6. Graph Access, revisions, resources, and other competing contextual surfaces are closed in the primary acceptance frame.
7. Idle connections remain quiet and arrowless; exactly one selected/hovered flow is visually local and does not turn the entire graph violet.
8. Minimap and navigation controls remain available but secondary; the graph, not shell chrome, owns the visual hierarchy.
9. The same scenario remains bounded at 1366x768 and 920x900; 375x812 remains review-only and exposes no continuation mutation path.
10. Human side-by-side review must explicitly accept the corrected capture before T6-003 returns to `VERIFYING`.

## RED-first ownership

- Add a dedicated T6-003 representative state fixture instead of repurposing the sparse resource workflow or the older T5-096 parity fixture.
- Serve deterministic lawful illustrative mock SVG/media from the existing mock host; do not use copied official media or real provider output.
- Select the focal node directly through Canvas interaction/inspection so Graph Access is never opened merely to establish the screenshot state.
- Add measurable browser assertions for visible family count, bounding containment, graph occupancy, selected representative media, attached above/below surfaces, closed competing contexts, one local flow, and zero document PATCHes.
- Only after those assertions fail for the current state should production presentation or contextual-surface code change.

## Corrected runtime outcome

- Final Unit 5C frame: `output/playwright/t6-003-visual-convergence/desktop-1440x900.png`, SHA-256 `C2ABA57956902D493DB87BE637851E8921B1B1249BA6B7238ECE2B5CDEBCFE1C`.
- Automated outcome: corrective criteria 1-9 are `PASS`; criterion 10 remains `PENDING` for new Human acceptance.
- The dedicated scene contains ten non-group nodes across the declared card families, lawful representative SVG media, one selected focal result, one localized hover flow, closed competing context surfaces, and zero document PATCHes.
- Desktop inspector closure now preserves selection and exposes an explicit accessible reopen action. The selected image result uses the existing atomic branch command through a real attached image/video continuation surface; disclosure itself does not mutate.
- Selection-toolbar placement consumes current visible media-toolbar and continuation geometry. The correction preserved the pre-existing video/keyframe rail placement contract after a focused regression exposed and fixed one overlap.
- Honest direct Canvas selection exposed a second overlap defect: the wide connection hit path could steal a card-center click. Node layout now wins only at overlapping coordinates, while true external edge segments and keyboard edge selection retain their existing authority.
- A stricter second comparison found script, note, and generation cards still suppressed their canonical internal header through generic external-label chrome. Unit 5B now consumes the internal type-title-body-lifecycle hierarchy while preserving external media/group labels and every serialized geometry contract.
- Unit 5C closes the remaining measured whole-frame gaps without expanding into shell replacement: short authoring/generation cards use `160` visible world px, medium/long authoring cards use `190/220`, vertical occupancy is at least `58%`, enabled grid dots are visibly present at `0.22` alpha through a transparent Leafer root, and the source-attached media toolbar uses an opaque surface with the strong semantic border.
- The taller cards exposed a current port hidden beneath an SVG edge hit target. Port acquisition now wins at that exact overlap while ordinary node-external edge pointer selection and accessible keyboard edge selection remain available.
- Fresh build, Unit 5C related regression `54/54`, continuation `16/16`, edge identity/insertion `5/5 + 6/6`, full functional Chromium `570/570`, headed performance `2/2`, snapshot-integrity guard, dependency/state/diff/UTF-8/BOM/sensitive-path/secret/database-artifact hygiene, and manual inspection of all four declared viewports pass.
