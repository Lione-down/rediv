# T5-096 Unit 7 Visible-Boundary Evidence

- Date: `2026-07-20`
- State: `COMPLETE`
- Scope: dynamic node visible-boundary parity after natural media metadata replaces persisted fallback dimensions.
- Product delivery: `775fba97c6a45ca3464e9c9ecd37d5c004481610` (`fix(canvas): align dynamic node ports`).

## LibTV-first reference

- Authority: official guide-published read-only Canvas share at `https://www.liblib.tv/canvas/share?shareId=W713Ltb3p`.
- Observation order: inspect the official share first, then verify Revid as the implementation counterpart. Local Revid authentication is not used as a reference authority.
- Safe trace: open the public share, settle the Canvas at 100%, inspect a populated media node, its external title/resolution, the incoming/outgoing edge landing, selection boundary, and attached contextual detail; do not invoke Copy Project, upload, generation, download, replace, group mutation, or any paid action.
- Publicly observable result: media is the visible node body; title and resolution remain outside that body; edge endpoints land on the visible media boundary; selection follows the same body; contextual detail stays attached to the source node.
- Existing lawful source records: `official-guide-exact-observations-2026-07-20.json` and `official-canvas-scenario-manifest.json` retain the public-share URL, exact viewport/zoom traces, and raw-reference hashes. The populated 1440x900/28% reference hash is `29f58980b2d475088e34edc752c889d0cff2261d94d8b77f4085c9cc83860d4b`; the selected-media 1440x900/39% reference remains the contextual-role source; the 207% high-zoom boundary remains explicitly separate from exact 200%.
- No new official screenshot is claimed for the Unit 7 100% read-only reinspection. This supplement records the observable geometry roles and reuses the already integrity-bound lawful source set.

## Revid RED and correction

- Deterministic fixture: persisted `560 x 560` fallback result whose image resolves after a bounded delay to natural `736 x 1312` metadata.
- RED: DOM visible right boundary `1294.140625` CSS px versus stale output-port center `1540` CSS px; drift `245.859375` CSS px.
- Root cause: existing Leafer ports retained creation-time coordinates after the shared layout size changed, while DOM media, card/selection, hit testing, minimap, and graph geometry consumed the reconciled size.
- GREEN: every existing renderer-managed input/output port is recomputed through `resolveCanvasPortGeometry` whenever the shared node layout changes. Serialization format, node identity, connection identity, command authority, and graph ownership are unchanged.

## Direct dynamic-metadata assertions

`frontend/tests/e2e/canvas-libtv-node-geometry.spec.ts` now proves, after the delayed metadata transition and at 17%, 36%, 100%, and 200% zoom:

1. DOM media body and Leafer card/selected outline share the same screen rectangle within 2 CSS px.
2. Input/output port centers land on the visible left/right boundaries and vertical center.
3. The existing persisted connection target endpoint lands on the recomputed input-port center.
4. A drag starting 12 CSS px outside the visible output dot but inside the 40 CSS px acquisition target opens the typed continuation flow.
5. Status overlay and media toolbar retain the node width/anchor within 2 CSS px.
6. The version stack retains its intentional 4-8 CSS px inset while following the reconciled width at every target zoom.
7. Natural metadata produces only bounded single-node PATCHes; it creates no connection upsert/delete or node delete. Zoom, selection, contextual disclosure, and the unfinished continuation draft add no further document PATCH.

## Representative contract coverage

- Portrait, landscape, and square media: `canvas-libtv-visual-parity.spec.ts` verifies natural ratio, visible surface, context menu, minimap, and zoom geometry.
- Authoring, generation, result, video, and group nodes: `canvas-node-presentation.spec.ts`, `canvas-libtv-visual-parity.spec.ts`, and the shared renderer/port tests verify content-shaped chrome, media/video presentation, group/static behavior, registry ports, and unchanged typed graph authority.
- The renderer correction iterates every existing port from the current presentation and shared layout size; it is not specialized to the portrait fixture or result-node ID.

## Current verification

- Focused Unit 7 Chromium: `2/2` passed.
- Current related node/port/connection/selection/media matrix: `47/47` passed.
- Production build: `4937 modules transformed`.
- Current full functional Chromium, excluding only the separately certified hardware performance title: `533/533` passed in `12.5m`.
- Existing headed AMD D3D11 200-node/300-connection evidence remains unchanged: `151.75 FPS`, frame P95 `20.9ms`, render `601ms`, pointer P95 `2.5ms`, longest task `0ms`, minimap `10.71/s`.

## Claim boundary

The earlier `0%` result remains limited to eleven declared populated 1440x900 outer landmarks. It does not prove port placement, edge endpoints/curves, selection outline, contextual layers, dynamic metadata reconciliation, typography, shadow, motion, or populated 1366/920 parity. Unit 7 closes the named dynamic-boundary behaviors through the direct assertions above; no whole-frame or real-provider fidelity claim is added.
