# TASK-T5-070 - Honest generation reference compatibility

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5 Canvas refinement
- Dependency: T5-069 must be `DONE - PASS`
- Owner: Codex Project Lead Engineer
- Requested: 2026-07-15

## Objective

Align every new generation-reference authoring path with the image-only request contract. Video, audio, text-result, and generation-task outputs must no longer present or accept a media connection that the provider context will silently exclude.

## Product direction

- Runway exposes only inputs supported by the selected model operation.
- Figma-style typed connection affordances disappear when a target cannot consume the source.
- Node editors should preserve old graph evidence without advertising unavailable future capability.
- Revid will block unsupported new authoring while retaining existing unsupported edges as visible excluded provenance.

## Scope

- Introduce one semantic authoring compatibility gate layered over structural persisted-port compatibility.
- Apply it to continuation menus, direct connect, reroute, edge insertion, connection highlighting, resource branching, workflow starters, and selection composition.
- Allow canonical image assets/results and legacy image nodes as generation references.
- Preserve existing persisted unsupported edges in generation context as `unsupported-media`.

## Non-goals

- Video-to-video provider support, audio generation, deleting legacy edges, migrations, provider calls, or changing image/keyframe limits.

## Acceptance criteria

- Image asset/result sources still offer image and video generation continuations.
- Video/audio assets, video/text results, and generation nodes expose no misleading generation-media continuation or compatible drop target.
- Generation media input upstream continuation lists only image-capable source types.
- Direct connect, reroute, insertion, and selection composition reject the same unsupported sources.
- Existing persisted video reference edges remain visible as excluded `仅支持图片，未使用` provenance.
- Valid multi-image generation order and provider payload remain unchanged.

## Verification

- Add pure RED coverage for subtype-aware continuation and authoring ports.
- Add Chromium coverage for visible chooser/drop-target behavior, legacy excluded provenance, image composition, compact, readonly, and zero unintended mutation.
- Run connection, generation context, input order, provenance, selection generation, build, visual, diff, file-size, and sensitive-path gates.
