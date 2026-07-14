# TASK-T5-010 - Page-level V2 UX upgrade

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5
- Dependency: T5-009 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Apply the approved V2 graphite-black/violet design system to Login, Home, Space, Admin, and their error, empty, loading, and responsive states without changing business contracts.

## Scope

- remove remaining light Phase 4 surfaces, gradients, cyan/green decorative accents, and white content cards from page-level UX;
- use V2 surface, text, border, semantic, spacing, radius, focus, and responsive roles;
- preserve existing loading, error, retry, empty, auth, asset, template, quota, and admin behavior;
- add route-level browser evidence at desktop and narrow/mobile review widths.

## Non-goals

- no new backend contracts, migrations, providers, or product capabilities;
- no Canvas interaction model changes except regression verification.

## Acceptance criteria

- Login, Home, Space, Admin, error, empty, loading, and responsive states visibly match the approved V2 roles;
- no page-level light card/gradient fallback remains in the covered routes;
- keyboard focus, reduced motion, mobile review boundary, and existing route behavior remain green;
- build and focused/full browser regression pass.
