# TASK-T5-055 Plan

- State: `DONE - PASS`
- Updated: 2026-07-15

## Audit findings

- Revid already resolves authoritative generation inputs and canonical result variants.
- Generic auto-arrange already emits deterministic reversible `arrange-nodes` commands, but creators must manually select the entire family first.
- Current multi-input and multi-result screenshots show valid semantics with avoidable crossings and irregular columns.
- The context header offers trace fitting, but fitting changes only the camera and does not improve graph geometry.

## Direction

- FigJam precedent: layout changes stay explicit rather than moving content in the background.
- ComfyUI precedent: left-to-right data-flow layers make converging inputs legible.
- Unreal Blueprints precedent: graph cleanup is a reversible editor operation.
- Reuse scoped SCSS, existing V2 tokens, radius scale, focus ring, and 0.96 press interaction.
- Reuse the command executor and history model, while adding a generation-family-specific resolver so visual order matches request semantics.

## Units

1. Add pure REDs for family resolution, T/R/G/V positions, exclusions, unsafe nodes, and deterministic no-op behavior.
2. Add browser REDs for generation/result entry points, one PATCH, exact undo/redo, no collateral mutation, compact, and readonly.
3. Implement the authoritative family arrange command and contextual action.
4. Run build, focused and related Chromium regression, plus 1440px, 920px, and 375px visual review.
5. Close report/state/pitfalls, perform a fresh diff review, commit, and push.

All units are complete. The contextual action delegates graph mutation to one established `arrange-nodes` command while a dedicated resolver owns authoritative family membership and geometry.

## Risks

- Generic topological order does not guarantee T-before-R or canonical V order.
- Moving only a subset of an unsafe family could imply a complete layout when it is not.
- Context actions must not steal selection or close the inspector.
- Tall media nodes require collision-free vertical spacing without arbitrary fixed row heights.
