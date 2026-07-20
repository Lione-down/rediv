# T6-002 Unit 10 Final Verification

Date: 2026-07-20

## Test split identity

Before splitting, the six frontend test/fixture files above 500 lines were `959`, `654`, `599`, `551`, `511`, and `501` lines. After behavior-domain extraction, no frontend test TS/JS file exceeds 500 lines; the largest split files are `496`, `454`, and `449` lines.

The ordered Playwright title baselines and post-split values are identical:

| Behavior set | Count | Ordered-title SHA-256 |
|---|---:|---|
| image operations | 15 | `CF0B0101A3686578A31F693B64155FB1246E241424B0A59DAB6DFF8357F8C2DC` |
| command interactions | 9 | `FB179C9348326C56CA8F3BC7DED1CA6CDB1B88D12199D32C85E8057DEFBD905E` |
| command contract | 12 | `B7403FAC2CD3AFE52B3A8385D6D01B1B2441884A817C03E096ECF68E64DBF10A` |
| project resource store | 10 | `AE2D97358114CEAC43D9BC2190D97C8B08C51E7AEA135437672E1FF306A96FC5` |
| shell navigation | 8 | `76DA171930A789C15393AC0C94352FE56C02C26AAA8516907449C24DEFB281A7` |

The public resource fixture retains the same 15 exports in the same order: `API_ORIGIN`, `APP_ORIGIN`, `PROJECT_ID`, `FIRST_CANVAS_ID`, `SECOND_CANVAS_ID`, `MockRequest`, `ResourceMockState`, `createResourceMockState`, `addProjectImageNode`, `addEarlierVariant`, `addTwoOriginMerge`, `addCinematicVideoNode`, `installResourceMockApi`, `openResourceWorkspace`, and `documentPatches`. Its pre-split ordered-export SHA-256 is `C4E8B30B19D4B679F9FE3144A7BCE9C30811416B2035CE2FAD04BA40B9FE7830`; the post-split barrel exposes that exact manifest.

## Regression evidence

- Affected-title Chromium: `54/54` passed after one RED fixture-wiring run exposed omitted local helper exports.
- Full backend with `backend/.venv-ci-check`: `577/577`, exit `0`, `506.6s`; only guarded disposable `revid_test_*` schemas were used.
- Production build: PASS, `4,952` modules transformed.
- Full deterministic functional/accessibility Chromium: `553/553`, `9.9m`; the exact hardware title was excluded by the CI contract and no other title was excluded.
- Headed 200-node/300-connection gate: `2/2`, `1.2m`, across both configured Chromium projects; unchanged render/FPS/frame/pointer/long-task/minimap thresholds passed.
- Initial full Chromium was `551/553` and exposed two Unit 9 edge cases: disabled recovery opener focus fallback and project-resource retention across same-project Canvas navigation. Both production fixes passed focused `3/3`, then the full `553/553` rerun.

## Hygiene

- Project-state and CI-contract validators: PASS.
- `pip check`: PASS in the locked backend environment; Alembic has one head at `c5d6e7f8a9b0`.
- `npm audit --audit-level=high`: `0` vulnerabilities.
- `git diff --check`: PASS; tracked database artifacts: `0`; frontend test files above 500 lines: `0`.
- Only the tracked configuration templates `.env.example` and `backend/.env.example` match the sensitive-path name scan; no real secret path or high-confidence secret signature is part of Unit 10.
- No real/paid provider call, secret access, user database, destructive operation, or user-owned untracked path entered verification or delivery.
