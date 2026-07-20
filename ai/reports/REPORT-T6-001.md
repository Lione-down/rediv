# REPORT-T6-001 - Revid-native cinematic director Skills v2

- State: `DONE`
- Verification outcome: `PASS`
- Date: `2026-07-20`
- Activation baseline: `034a49f45952cfa0f893363d401aa9ccf52eddbd`
- Human decision: `ACCEPT`

## Delivered

- Reproduced the Human-reported detached draft connection with `155 CSS px` of source drift under a translated viewport. The correction keeps interaction in surface space, constructs the SVG path in world space, and applies the viewport transform exactly once. Actual draft endpoints now land on the visible port/pointer at 17%, 36%, 100%, and 200% zoom.
- Extended exactly three Revid-owned cinematic Skill IDs to active v2 while preserving exact v1 history and fail-closed lifecycle/version resolution. No imported, remote, provider-branded, or generic execute runtime was added.
- Added strict provider-neutral director brief, reference transfer, sequence canon, and retake contracts in backend and frontend. Explicit user instructions and per-reference rules retain precedence; unsupported intent fails before mutation.
- Added a pure deterministic v2 director compiler and reused the existing authenticated native text/image/video generation authorities. Preflight remains non-mutating; explicit Send persists the byte-equal canonical request, digest, and immutable task snapshot with drift checks.
- Kept cinematic sequence state inside canonical script-node content and the existing Canvas command/history/autosave/revision/recovery authority. Planning exposes only the next unresolved clip; accepted current-Canvas results plus user-reviewed observed end state are the only continuation canon.
- Added duplication-safe canon remapping and progressive take review. Keep advances canon once; Reroll and Rewrite create a bounded single-variable preflight and never execute without a later explicit Send.
- Closed the existing cross-Canvas input-generation/source-node-deletion deadlock by restoring the shared `assets -> generation_tasks` lock order without changing replay semantics.
- Completed fresh review, file-size splits, source/license review, and a 21-row acceptance audit. Human Owner accepted the final 1440x900 reference-transfer and 375x812 review-only screenshots on 2026-07-20.

## Verification

- Detached-edge RED/GREEN: `155 CSS px` RED drift; GREEN actual SVG endpoints within the required boundary at 17/36/100/200%, with related connection/port/reroute/motion Chromium `34/34`.
- Cinematic offline eval: `14/14` plus `14` subtests.
- Final backend: `564/564` plus `147` subtests; final post-split focused recovery `23/23` plus `3` subtests.
- Final functional Chromium: `551/551` with the hardware-only performance title verified separately.
- Named UX/accessibility/responsive/IME/focus/reduced-motion/zoom matrix: `56/56`; axe serious/critical findings `0`.
- Accepted-canon switching/reload evidence: exact case `1/1`; cinematic/sequence/autosave/document-persistence/revision-recovery matrix `34/34`.
- Production build: `4947 modules transformed`.
- Headed AMD D3D11 200-node/300-connection gate: `2/2`, `126.63 FPS`, frame P95 `18ms`, render `531ms`, pointer P95 `2ms`, longest task `0ms`, minimap `11.24/s`; thresholds were not weakened.
- Final UTF-8/BOM, diff, sensitive-path, strong-secret-signature, source/license, exact-stage, and HEAD-drift checks passed.

## Boundaries

- No real or paid provider call was made. Real-provider capacity, fidelity, and creative quality remain unverified and are not claimed.
- No provider integration, database table/migration, second scheduler/store/Canvas authority, cross-Canvas edge, mobile editing, external account, secret access, `.env` inspection, or destructive operation entered the delivery.
- The external workflow repository informed concepts only. No source code, substantial prose, prompt, provider/router table, example, asset, runtime, package, or metadata was copied; no third-party notice addition is required.
- Raw review PNGs remain under untracked `output/`; user-owned `.codex/` and `.hermes/plans/` remain untracked and excluded from delivery.

## Delivery

- Task, PLAN, PROGRESS, evidence, implementation, tests, REPORT, CURRENT, ROADMAP, scoped commits, and `origin/main` are synchronized to `DONE - PASS`.
- T6-001 is complete. No T6-002 or later Product V3 Task is activated.
