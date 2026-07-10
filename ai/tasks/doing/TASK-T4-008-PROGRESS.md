# T4-008 Progress - Real-Data Home Project And Asset Dashboard

Last updated: 2026-07-11

## State

- Before this run: `DOING`, Slice A and Slice B1 completed and committed
- Current: `DOING`
- Completed bounded unit: Slice B2, Home presentation and real-data states
- Starting branch: `main`
- Starting HEAD: `518682b14f00189b3815fe25addcb18e48398961`
- Pre-existing staged/modified files: none
- Pre-existing untracked files: `frontend/.playwright-cli/` and `output/`; browser evidence only, excluded from delivery staging
- Unmerged paths or in-progress Git operation: none

## Completed Work

- Replaced the 951-line marketing Home and fabricated quick-start/status content with a 499-line authenticated utility dashboard backed by the project, asset, and quota stores.
- Added five Home-local components for the route header, project list, recent assets, quota summary, and create-project dialog; every file remains under 500 lines.
- Implemented independent initial loading, empty, first-load error, refresh-error-with-cache, partial-data, zero-quota, frozen-generation, create-success, and create-error states.
- Added immediate real project creation with trimmed/length-validated input, single-flight store behavior, input/error preservation on failure, and explicit backend project ID navigation to `/app/workspace?project_id=...`.
- Removed all implicit Home Workspace links while preserving Space and conditional Admin navigation; the public root continues to provide login/register entry without exposing authenticated data.
- Added synchronous project-store auth-token reset, stale-completion isolation, synchronous modal draft closure on every token switch, and a synchronous Axios request interceptor so a mutation credential cannot be retargeted between accounts.
- Preserved recent-asset semantics without presenting the loaded page length as an account-wide total; URL queries are not displayed and unknown/prototype-key wire values use neutral labels/icons.
- Added keyboard-visible focus, accessible button names, modal focus containment, native label/error association, `aria-invalid`, `aria-describedby`, backdrop/ESC behavior, reduced-motion handling, and responsive layouts at the Task breakpoints.
- Completed a fresh Deep review with security, architecture, UI/accessibility, and adversarial passes. Confirmed findings for credential binding, cross-session modal draft, summary semantics, modal dismissal/focus, inherited wire keys, navigation preservation, and contrast were fixed; final specialist re-reviews report no remaining finding.

## Remaining Work

1. Complete Slice C authenticated real local-backend/MySQL cross-check, responsive browser acceptance, final REPORT, and closure.

## Exact Next Action

Run Slice C against an authorized local backend/MySQL runtime: authenticate, verify Home projects/recent assets/quotas against real API data, create one acceptance project, cross-check its ID/name/created_at in MySQL without opening or printing secrets, and capture 1440x900, 920px, and 375px browser/console/overflow evidence. Then perform the final diff review, write REPORT, and close T4-008 only if every non-deferred criterion passes.

## Files Changed

- `frontend/src/api/request.ts` - synchronously binds the current Authorization header before mutating requests can be retargeted by a session switch.
- `frontend/src/modules/project/store.ts` - synchronous token-change reset and explicit create-error clearing.
- `frontend/src/views/app/Home.vue` - real-data session orchestration, explicit project navigation, guest/auth branches, and responsive dashboard layout.
- `frontend/src/views/app/components/home/home-route-header.vue` - Home-local brand, Space/Admin, refresh, and project-create actions without an implicit Workspace link.
- `frontend/src/views/app/components/home/home-projects-panel.vue` - real project loading/error/empty/list states and explicit project actions.
- `frontend/src/views/app/components/home/home-recent-assets.vue` - recent-only asset states, safe title parsing, and neutral unknown wire-value fallbacks.
- `frontend/src/views/app/components/home/home-quota-summary.vue` - real quota/frozen/zero presentation.
- `frontend/src/views/app/components/home/home-create-project-modal.vue` - accessible validated create form and controlled modal lifecycle.
- `ai/tasks/doing/TASK-T4-008-PLAN.md` - marks Slice B2 complete.
- `ai/tasks/doing/TASK-T4-008-PROGRESS.md` - records Slice B2 implementation, verification, remaining work, and next action.
- `ai/tasks/todo/TASK-T4-008.md` - records the narrow request-interceptor security hardening allowed by the confirmed credential-retarget finding.
- `ai/state/CURRENT.md` - advances the rolling snapshot to completed Slice B2 and Slice C next.

## Commands And Summarized Results

- Required read set and Git baseline: PASS; `main` at `518682b14f00189b3815fe25addcb18e48398961`, no staged/modified/unmerged/Git-operation state, with only the known untracked browser artifacts. Codex task-list inspection timed out, so branch/HEAD/index rechecks remain the single-flight fallback.
- Complete Home/project/auth/asset/router/design-system audit: PASS; existing contracts, root-route decision, Workspace query consumption, component conventions, and responsive/token constraints were read directly.
- Ephemeral Vite SSR/Axios project-store harness with `envFile: false`: PASS, 20 checks covering synchronous token reset, stale success/failure isolation, duplicate create, immediate prepend, totals, and refresh-failure cache preservation.
- Focused credential-binding race harness with `envFile: false`: PASS, 4 checks; an A-token create retained `Bearer token-a` after an immediate A-to-B switch and did not mutate the B store.
- Final Playwright CLI mocked real-router/browser matrix: PASS, 12/12 scenarios with no console/page errors. Covered real data, zero quotas, prototype-key unknown assets, recent-only semantics, A-to-B draft reset, backdrop dismissal, loading/empty, both partial-failure directions, accessible validation, pending/single POST create, create failure preservation, exact scalar `project_id`, 401 cleanup, Space/Admin links, and focus/CTA computed styles.
- Responsive browser evidence: PASS at 1440x900, 920x900, and 375x812 with scroll width equal to viewport width. The 375px create dialog was 351px wide, fully opaque, input-focused, and overflow-free; screenshots are under `output/playwright/t4-008-slice-b2/` and remain untracked.
- Final `npm run build`: PASS; Vue typecheck and Vite production build completed with 4,663 modules transformed.
- Fresh Deep review and adversarial pass: PASS after fixes; security, architecture, and UI/accessibility re-reviews report zero remaining findings, and CTA hover contrast was rechecked at approximately 6.79:1.
- `Home.vue` line count and fabricated/implicit-entry scans: PASS; 499 lines, no legacy fabricated values, and no Home-local implicit `/app/workspace` link.
- Final post-state-update `git diff --check`: PASS; no whitespace errors, with expected Git for Windows LF-to-CRLF notices only.

## Blockers And Release Conditions

- No active implementation blocker.
- Slice C real MySQL acceptance requires an authorized runtime capability; do not read `.env` files or print credentials. If no safe runtime is available, record the exact verification blocker rather than substituting mock evidence.
- T4-005 Unit B remains a separate Human cost gate and is outside T4-008.
