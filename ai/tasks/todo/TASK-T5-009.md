# TASK-T5-009 - Global V2 app-shell and shared-component rollout

- State: `DONE - PASS`
- Phase: Product V2 / Phase 5
- Dependency: T5-008 `DONE - PASS`
- Owner: Codex Project Lead Engineer

## Objective

Apply the approved graphite-black/violet V2 design system to the global app shell, authentication shell, Admin layout, and shared top navigation while preserving the certified Canvas route.

## Scope

- token bridge from legacy global variables to approved V2 OKLCH roles;
- global body/app-shell surfaces, typography, focus rings, controls, and navigation;
- shared `AppTopBar`, `AuthShell`, and `AdminLayout` dark-purple treatment;
- regression checks for Canvas, Login, Space, and Admin routes at desktop and narrow widths.

## Non-goals

- page-specific Login/Home/Space/Admin UX redesign owned by T5-010;
- Canvas interaction or persistence contract changes;
- new UI library, Tailwind, gradients, glass blur, or paid provider calls.

## Acceptance criteria

- [ ] Legacy global tokens resolve to the approved V2 palette without light surfaces or cyan accents.
- [ ] Shared shell/navigation/focus styles use V2 roles and 40px targets.
- [ ] Canvas focused regression remains green at all certified viewports.
- [ ] Login, Space, and Admin shared shell screenshots show dark-purple V2 treatment.
- [ ] Build, focused browser checks, full Chromium, and diff/static hygiene pass.
