# Hermes Revid Card Archive — 2026-06-30

## Authorization

Human Owner explicitly requested clearing old invalid cards on 2026-06-30. PMC interprets “clear” as archive from active Kanban views, not permanent `archive --rm` deletion. Archived rows, runs and audit evidence remain recoverable.

## Preconditions

- Board: `revid`
- Non-archived cards before action: 52
- Active `running`, `ready`, `review`, or `scheduled` chain: none
- Queue revision `26r1`: terminal and non-executable
- Gateway: running with hardened runtime, PID `11888`

## Archive set — 34 cards

### Superseded revisions 05–14

`t_f53b3c08`, `t_68c68e4e`, `t_e23d9043`, `t_748c116d`, `t_fba90f6a`, `t_8ee01149`, `t_e0024944`, `t_7de26b8b`, `t_6a10f787`, `t_b788cdb9`, `t_3769f8ec`, `t_4014b64c`, `t_083a9aab`, `t_4ce6da95`, `t_bbbf72bd`, `t_7275328d`.

These chains were superseded by later approved revisions or contained blocked/todo children that cannot legally continue.

### Terminal runtime failures and diagnostic smokes

`t_aeaefef4`, `t_3e1f6a06`, `t_20945c04`, `t_5f21c6fd`, `t_101eaf28`, `t_5414e0be`, `t_63fc0c5e`, `t_b842052f`, `t_b493a47f`, `t_1617a921`.

These are terminal pre-dispatch failures or isolated diagnostic cards, not executable business chains.

### Invalid/superseded revisions 21, 23–26r1

`t_14b8871f`, `t_689f993e`, `t_1dea37a2`, `t_53630896`, `t_cc15e296`, `t_25ac2145`, `t_3a287a75`, `t_f46c8d6e`.

These cards contain invalid child contracts, failed transports/timeouts, obsolete retry topology, or the `REVIEW_DISPATCH_ONLY` → `DISPATCH_ONLY` misrouting.

## Retained evidence — 18 cards

The following remain visible because they represent accepted Unit A/B/C1 evidence or current rev22/rev26 business evidence:

`t_8283dcb8`, `t_5f026ccc`, `t_34896d9c`, `t_ec3b4dfd`, `t_3edc9fc9`, `t_c1f5c0b8`, `t_1a9f1d32`, `t_6b4b7bc8`, `t_67184ab2`, `t_3bfbe611`, `t_b3cfb6ce`, `t_bd6172b7`, `t_8f3b60ff`, `t_b918a49e`, `t_971a76d5`, `t_4f178d0c`, `t_c14aa473`, `t_9f24648e`.

## Prohibitions

- Do not permanently delete archived rows with `archive --rm`.
- Do not archive the retained evidence set without a new Human Owner instruction.
- Do not treat archive as clearing failure fingerprints or authorizing a new Queue.

## Result

- Archive command exit: `0`
- Archived and read-back verified: `34/34`
- Cards still active from archive set: none
- Non-archived cards after action: `18`
- Retained status counts: `done=16`, `blocked=2`
- Active `running`, `ready`, `review`, or `scheduled` cards: none
- Permanent deletion: not used
