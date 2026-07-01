# PMC REVIEW — Hermes Update Durability PASS

## Verdict

`PMC_PASS — RUNTIME_PATCH_UPDATE_DURABILITY`

This supersedes `REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-BLOCKED-2026-06-30.md`. It is a runtime/deployment verdict, not T4-002 business PASS.

## Resolution

- Human Owner authorized retaining the new upstream `apps/desktop/electron/main.cjs`; the obsolete bundled copy remains recoverable in updater `stash@{0}` but is not active.
- The ten-file Python runtime/test delta was restored against upstream `1b3768558e`.
- A complete gzip+base64 patch is now project-owned at `ai/runtime/patches/hermes-runtime-role-contracts.patch.gz.b64`.
- `ai/runtime/deploy-hermes-runtime-contracts.py --apply` is idempotent: it reports already applied, applies only to a compatible clean upstream checkout, and otherwise fails closed.
- Scheduled Supervisor now runs deploy + verifier before ACK or card creation, so a future Hermes update cannot silently consume Queue work without restoring/validating enforcement.
- Default and all five role SOULs contain the Chinese Human Owner delivery marker and match project templates.

## Fresh verification

- Project runtime/launcher/verifier/deployer: `14 passed`.
- Affected Hermes worker spawn + Kanban tool suites: `107 passed`.
- Installed runtime Python compilation: passed.
- Five correct Action policies resolved exact tool counts: Dispatcher 8, PM 8, Backend 13, Frontend 18, Reviewer 18.
- Wrong Action probes failed closed for all five profiles.
- Chinese SOUL code-point/marker check: default + five profiles passed.
- `ROLE_CONTRACTS_OK`.
- Repeat deployment: `HERMES_RUNTIME_PATCH_ALREADY_APPLIED`.
- Gateway cleanly restarted and is running at PID `11888`.
- Both repository `git diff --check` validations passed.

## Kanban cleanup

Under explicit Human Owner authorization, 34 terminal/obsolete/invalid cards were archived, not permanently deleted. Eighteen valid business/review evidence cards remain; no active execution chain exists. Evidence: `ai/runtime/HERMES-CARD-ARCHIVE-2026-06-30.md`.

## Remaining gate

Only `SECURITY_ROTATION_REQUIRED` remains before a fresh executable Queue may be published. Human Owner must rotate the shared Agnes/APIHub model provider key across all five Revid profiles and confirm completion without sending the value in chat.
