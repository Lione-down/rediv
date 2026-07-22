# T6-003 Unit 6Q - LibTV detached floating output control

- Date: `2026-07-22`
- Reference: Human-supplied authenticated editable Canvas at `https://www.liblib.tv/canvas?spaceId=878893&projectId=ccf8bd537cb048a9a5ea767750c0b05c`
- Observation class: lawful clean-room, read-only rendered DOM and pointer behavior
- Excluded actions: no upload, generation, graph edit, form submission, paid action, credential inspection, or private implementation access

## Human correction

The Human accepted the overall card direction but rejected the current output `+` behavior. Revid moves the control only vertically on the card boundary. The expected control is detached from the card and follows the pointer in both axes inside an outside hover region before returning to rest.

## Fresh official measurement

The first visible image card measured `622 x 350 CSS px`, with its right midpoint at approximately `(544.677, 258.032)` in the viewport.

- The logical output handle is a zero-size point at that exact card-boundary midpoint.
- Its pointer acquisition surface is an `80 x 80 CSS px` circle whose left edge begins at the card boundary and whose center is approximately `(584.677, 258.032)`. The surface is entirely outside the card.
- The visual control is `20 x 20 CSS px` at rest. Its hidden reset center is approximately `(559.677, 258.032)`, or `15 CSS px` outside the logical boundary.
- Moving the pointer to `(590, 235)` produced a settled control center of exactly `(590, 235)` and a `22 x 22 CSS px` hover visual. This proves X/Y pointer following rather than edge-only Y movement.
- Moving farther to `(615, 275)` produced a settled center of approximately `(610.857, 272.682)`. That point is exactly `30 CSS px` from the acquisition-circle center, proving radial follow clamping.
- Leaving the acquisition surface restored the center to approximately `(559.677, 258.032)`, opacity to `0`, and scale to `1`. The observed follow transition was approximately `80ms`; reset used an approximately `400ms` spring-like transform transition plus a shorter opacity transition.
- While the visual control was settled at `(590, 235)`, the existing image-to-video edge still began at approximately `(544.677, 258.032)`. The floating control and the persisted edge anchor are deliberately different geometries.

## Corrected Revid contract

1. Keep every logical output port and every existing outgoing path on one fixed right-boundary midpoint anchor.
2. Present the output `+` as a separate, card-external feedback control.
3. Use one CSS-stable `80px`-diameter circular acquisition surface outside the right midpoint.
4. Follow the pointer in both X and Y, clamp the follower radially to `30 CSS px`, and keep the complete visible control outside the card.
5. Reset deterministically to an outside resting position on leave, cancel, readonly, lock, layout, or viewport invalidation.
6. Start a new connection from the fixed logical boundary midpoint, not from the transient floating control.
7. Preserve `20 world px` Revid visible-port sizing, typed logical IDs, exact compatible landing, existing commands/history, and zero graph/autosave mutation during hover.

## Superseded conclusion

Unit 6O correctly fixed projected-node detachment, but its stronger assertion that existing outgoing paths must follow the visible `+` is not LibTV-faithful. Unit 6Q supersedes only that coupling. Shared logical boundary convergence remains required.
