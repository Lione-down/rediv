# T4-002 PMC Runtime Policy Remediation Authorization - Rev44r1

## Verdict

`PMC_BLOCKED - RUNTIME_POLICY_REMEDIATION_AUTHORIZED`

PMC explicitly authorizes Hermes runtime owner to fix and prove the runtime/profile policy boundary that blocks `revid-pm / REVIEW_DISPATCH_ONLY`.

## Authorized Scope

Hermes runtime owner may:

- modify only Hermes-owned runtime/profile policy for `revid-pm / REVIEW_DISPATCH_ONLY` and `HANDOFF_ONLY`;
- add bounded Kanban lifecycle capabilities required to create child cards and terminalize lifecycle coordinators;
- avoid unrestricted `terminal` access;
- run non-destructive same-profile smoke proof showing exactly one Reviewer child and one dependent `HANDOFF_ONLY` child can be created and terminalized under the bounded policy;
- write fresh runtime remediation evidence with verdict `READY_FOR_CONTINUATION`, `STILL_INFRA_BLOCKED`, or `NEEDS_HUMAN_DECISION`.

## Not Authorized

- No project Reviewer or HANDOFF artifacts for rev44 may be created from the current terminal Queue.
- No lifecycle continuation, replacement coordinator, Executor rerun, business REWORK, business file modification, database access, `.env` read, secret output, T4-003 unlock or PMC PASS is authorized.
- Do not create, retry, claim, promote, unblock, reparent, archive, delete or reuse `t_a2509036`, rev44 Dispatcher `t_04f179d0`, rev44 Executor `t_64a40afd`, or older Unit C3 cards.
- Do not grant broad unrestricted `terminal` as the policy fix.

## Required Proof

Return `READY_FOR_CONTINUATION` only if fresh evidence proves:

- the bounded policy is installed or otherwise active for the exact lifecycle path;
- `revid-pm / REVIEW_DISPATCH_ONLY` can create exactly one Reviewer child;
- it can create exactly one dependent `HANDOFF_ONLY` child;
- the coordinator can terminalize without unrestricted terminal access;
- the proof does not write project REVIEW/HANDOFF artifacts, access databases, read secrets, or reuse historical cards.

If any item is missing, return `STILL_INFRA_BLOCKED` with owner, next action and evidence path.

## Human Decision

Human Owner selected strict flow. This authorization supports that flow by allowing the runtime policy fix, not by bypassing Independent REVIEW or HANDOFF.
