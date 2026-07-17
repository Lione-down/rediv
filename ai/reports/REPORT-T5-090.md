# REPORT-T5-090 - Revid native Agent/Skill interface

- Status: `DONE - PASS`
- Baseline: T5-089 pushed at `dc576fb72473c56dacbf16323730ce9d6c77b29e`
- Scope: a Revid-owned Agent/Skill v1 interface only; no provider execution, external runtime, migration, secret, paid call, or UI redesign.

## Delivered

- Added a code-owned closed registry with one exact built-in: `revid.canvas-context` version `1`, intent `canvas-context`, `mock-only`, and no acknowledgement requirement. Capabilities also name `unavailable` but no unregistered, imported, remote, user-authored, marketplace, package, shell, or `SKILL.md` execution is accepted.
- Added authenticated `GET /api/projects/{project_id}/canvases/{canvas_id}/agent-skills` and `POST .../preflight`. Both reuse `current_user` and `canvases.get_canvas`; preflight reads the current Canvas document only. It validates 1–25 unique source IDs, current Canvas membership, exact canonical node type/subtype/version, malformed/unhashable input, and preserves request order.
- Preflight returns the exact manifest plus node id/type/subtype source roles and only unavailable provider/quota/task authorities. There is intentionally no `/execute` route. Existing text/image/video generation routes are immediate durable provider/task flows and are not wrapped as a generic Agent executor.
- Added strict frontend parsing/request validation and a desktop Palette action with async Agent context overlay. The panel says `Mock-only` and has no execute control. It uses the existing visual system, closes with Escape, begins on the close button, honors reduced motion, passes scoped axe, and is unavailable at the 375px review-only boundary.
- No graph command, history, autosave, task, quota, asset, result, provider, or model-selection mutation is made by discovery or preflight. Existing Canvas/Storyboard/connection/result branch behavior was retained.

## Verification

- Backend contract/API focused tests: `8/8`; `py_compile` passed. Coverage includes strict registry, future/unknown/malformed/canonical source rejection, current user/Canvas scope, 403 foreign Canvas, deterministic ordering, and the absent execute endpoint.
- Frontend contract/Palette tests: Agent typed contract `3/3`; focused Agent UI/Palette/registry `14/14`; Agent UI axe/375px/no-mutation `2/2`; affected Storyboard Palette regression `15/15`.
- Production build: `npm run build` passed with `4,921` transformed modules.
- Final functional Chromium: `472/472` passed in 8.7 minutes after excluding the separately classified 200/300 FPS title. The full combined run first produced `481/483`: one Storyboard count expectation correctly changed from 10 to 11 for the new action and then passed 15/15; the FPS title measured 49.54023466089565 under full-suite load.
- Fresh isolated 200/300 title passed with unchanged limits: 57.51915151981589 FPS, 16.800000000000182ms p95, 2529ms stable render, 7.700000017881393ms pointer p95, 56ms longest task. Environment was SwiftShader with hardware acceleration disabled. The combined-run low FPS remains documented rather than hidden or threshold-weakened.
- Visual evidence was inspected at `output/playwright/t5-090-agent-skill-preflight/agent-skill-preflight-1440x900.png`.
- `git diff --check` passed; no listener remains on 8000 or 9099.

## Deliberate boundaries

- The broad `unittest discover` invocation was stopped after its MySQL test harness began Alembic upgrades. It is not counted as green evidence and no service/database migration is authorized by this Task.
- A real native generation handoff remains unavailable. T5-091 may use only this registration/preflight surface and needs a separate future Task for explicit acknowledgement plus the existing native generation/task authority.
