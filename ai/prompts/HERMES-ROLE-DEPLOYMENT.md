# Hermes Revid Role Deployment Map

| Profile | SOUL template | Accepted Action |
|---|---|---|
| `default` | `ai/prompts/hermes_system_prompt.md` | supervisor only |
| `revid-dispatcher` | `ai/prompts/hermes-revid-dispatcher-soul.md` | `DISPATCH_ONLY` |
| `revid-pm` | `ai/prompts/hermes-revid-pm-soul.md` | `REVIEW_DISPATCH_ONLY`, `HANDOFF_ONLY` |
| `revid-backend` | `ai/prompts/hermes-revid-backend-soul.md` | `IMPLEMENT_AND_TEST_ONLY` |
| `revid-frontend` | `ai/prompts/hermes-revid-frontend-soul.md` | `IMPLEMENT_AND_TEST_ONLY` |
| `revid-reviewer` | `ai/prompts/hermes-revid-reviewer-soul.md` | `INDEPENDENT_REVIEW_ONLY` |

## Deployment gate

1. Pause the Revid scheduled supervisor without changing existing cards.
2. Deploy all SOULs and all `kanban.worker_tool_policies` as one configuration unit.
3. Run `ai/runtime/verify-hermes-role-contracts.py`; do not print config values outside the policy section.
4. Restart Gateway once so runtime code/config reload together.
5. Run unit tests and isolated action/profile smoke checks. Never use the Revid board or business database for smoke testing.
6. Resume only the schedule that was running before deployment. Never reuse, unblock, or mutate a terminal card.

Any template/deployed/config drift is a failed deployment. A new Queue revision may be considered only after fresh runtime-health evidence; revision changes do not clear an old failure fingerprint.
