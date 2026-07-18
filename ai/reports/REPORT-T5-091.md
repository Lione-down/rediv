# REPORT-T5-091 - Revid native cinematic Skills and reference-aware generation

- Status: `DONE - PASS`
- Baseline: T5-090 state closure `c27e6f9058d15a3da3be461f816953d395f65444`
- Business delivery: `1f3077c9208a0a7590d1ab549e89210a49d0b923` pushed to `origin/main`
- Scope: three Revid-owned cinematic Skills, structured references, exact native handoff, user-owned provider/model selection, billing acknowledgement, and stale lineage; no external Skill runtime or real provider call.

## Delivered

- Preserved T5-090 contract v1 exactly and added explicit v2 discovery for only `revid.cinema-script.v1`, `revid.cinema-image.v1`, and `revid.cinema-video.v1`. There is still no generic execute route, imported/remote Skill, arbitrary code, package, shell, or marketplace runtime.
- Added authenticated current-project/current-Canvas source indexing, stable structured mention IDs, rename-safe source revisions, deterministic bounded group expansion, explicit roles, backend capability validation, canonical serialization/digest, concise summary, and collapsed exact request disclosure.
- Added backend-owned Agnes text/image/video provider/model catalog. The frontend does not hardcode options or auto-route; the recommendation is off until the user explicitly enables it, and ordinary generation performs zero cinematic discovery or hidden optimization.
- Added deterministic script, image, and video constraint envelopes with exact instruction precedence. Unsupported reference media, roles, keyframes, controls, stale sources, capability drift, acknowledgement drift, prompt drift, or provider/model drift fail before the native generation transaction.
- Reused existing text/image/video generation, quota, task, result, retry, history, autosave, recovery, Storyboard, and downstream branch authority. Every task snapshot keeps the exact Skill/version, references, source revisions, provider/model, capability version, parameters, canonical request, and digest. No evaluator, auto-retry, auto-regeneration, or model switching was added.
- Extended shot schema backward-compatibly to strict v2 story/character/shot data. Cinematic script generation validates provider JSON before one atomic Canvas graph command; malformed output creates no graph mutation. Editing the source leaves historical output visible and stale until an explicit new action.
- Added server-authoritative provider-cost acknowledgements isolated by user/provider, with 24-hour default, 30-day maximum, expiry, cancellation, GET/upsert/delete API, fully commented model/table fields, and Alembic head `f2a3b4c5d6e7`. The migration passed on disposable guarded MySQL only and was not applied to user/runtime data.
- Canvas duplication remaps structured mention IDs and strict shot lineage while refreshing duplicated source revisions; historical tasks/results remain immutable and reruns explicit.

## Verification

- Focused backend cinematic contract/execution/billing and affected restart/duplication evidence passed `34` tests plus `15` subtests; the guarded provider acknowledgement migration passed `1/1` on disposable `revid_test_provider_cost_acknowledgement_migration`.
- Full backend passed `512` tests plus `116` subtests in `461.36s`. The first run exposed four expected-head assertions left at `e1f2a3b4c5d6`; those assertions were advanced to the authored `f2a3b4c5d6e7` head and the final full run was green.
- Final production build passed with `4,926` transformed modules.
- Final focused cinematic Chromium passed `8/8`: explicit default-off enable, zero silent discovery, structured mention/Escape/undo/redo, exact disclosure and submit equality, 1366/920/375 ownership, billing cancel/24-hour acknowledgement, first/last keyframes, and strict script graph creation.
- Final functional Chromium, with only the separately classified 200/300 title excluded, passed `496/496` in `10.4m`.
- Final unchanged 200-node/300-connection title passed at `56.35185107977278 FPS`, `16.80000000000291ms` frame p95, `557ms` stable render, `9.899999976158142ms` pointer p95, `62ms` longest task, and `10.482516316828043` minimap updates/s. Chromium used SwiftShader with hardware acceleration false.
- Performance variability was retained rather than hidden: earlier current runs measured about 46.54–51.84 FPS; a no-Cinematic-Context diagnostic still measured 48.13 FPS; exact baseline `c27e6f9` measured 56.86 then 47.16 FPS. The final current pass used three consecutive machine CPU samples below 25% and no test, worker, duration, product code, or threshold change.
- Responsive/keyboard/a11y/no-overflow browser checks passed across 1440, 1366, 920, and 375 review-only ownership. `output/playwright/t5-091-cinematic-skills/cinematic-image-1440x900.png` was inspected and matches the existing graphite-black/violet Context surface.
- `git diff --check`, staged forbidden-path scan, secret-value scan, UTF-8 BOM audit, Alembic single-head check, and 8000/9099 listener check passed. `.codex/`, `.hermes/plans/`, `output/`, `.env`, and sensitive key/certificate paths were excluded.

## Deliberate boundaries

- No `.env`, secret, real/paid provider, external account, destructive user/production database operation, arbitrary/remote Skill execution, LibTV private content, second generation authority, automatic retry, or automatic regeneration was used or added.
- Real Agnes visual quality, style retention, identity continuity, and motion continuity are not proven by contract, mock, browser, HTTP, or file-existence evidence. An authorized real-service sample plus separate Human Owner verdict remains required before any visual-fidelity claim.
- Repository migration head is authored and disposable-test verified. Applying `f2a3b4c5d6e7` to user/runtime data remains a Human Owner gate with backup/review discipline.
