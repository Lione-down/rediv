# PMC REVIEW — Hermes Update Durability Blocker

> Resolved and superseded by `REVIEW-T4-002-PMC-HERMES-UPDATE-DURABILITY-PASS-2026-06-30.md` after Human Owner approved retaining new upstream `main.cjs`, the runtime delta was packaged as a repeatable project-owned patch, fresh tests passed, and Gateway reloaded.

## Verdict

`PMC_BLOCKED — RUNTIME_PATCH_UPDATE_DURABILITY`

The earlier runtime-only `PMC_PASS` is temporarily superseded. No executable Queue may be published.

## Fresh evidence

- Hermes updated from local HEAD `7d568293f9` to upstream `1b3768558e` at 2026-06-30 22:13–22:14.
- Reflog records `reset: moving to origin/main` followed by `reset: moving to HEAD`.
- The updater preserved local runtime work in `stash@{0}: hermes-update-autostash-20260630-141343` but did not restore it into the working tree.
- Before recovery, the role verifier correctly reported all installed runtime markers missing while profile SOUL/config remained present.
- Applying the preserved stash restored the Python runtime changes and 107 affected tests passed, but the old bundled `apps/desktop/electron/main.cjs` conflicts with the new upstream source form. The stash remains intact.
- Chinese Human Owner delivery rules have been restored in the default and five role SOUL templates/deployments. Project tests now report 12 passed and the verifier reports `ROLE_CONTRACTS_OK` against the restored Python files.

## Root cause

The role fix depended on uncommitted edits inside an auto-updated upstream checkout. Hermes update correctly autostashed them, but an unrelated/stale generated Desktop bundle conflict prevented clean restoration. Therefore an upgrade could silently remove runtime enforcement until a verifier detected it.

## Required resolution

1. Preserve `stash@{0}` as rollback evidence.
2. With Human Owner approval, resolve only `apps/desktop/electron/main.cjs` to the new upstream version; do not reintroduce the obsolete bundled copy.
3. Package the Revid runtime delta as a project-owned, repeatable post-update patch/deployment step and make `ROLE_CONTRACTS_OK` a pre-Queue hard gate.
4. Rerun 107 Hermes tests, 12 project tests, verifier, Gateway reload and isolated Action/profile smokes.
5. Rotate the shared Revid model provider credential before publishing a continuation Queue.

Historical card `t_f46c8d6e` and revision `26r1` remain terminal and untouched.
