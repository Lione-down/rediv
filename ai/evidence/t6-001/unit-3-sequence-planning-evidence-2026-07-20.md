# T6-001 Unit 3 Sequence Planning Evidence

- Date: `2026-07-20`
- Baseline: `ced6cd57edea77ed9027bc85f6fe5ba6e42fd34c`
- Representation: canonical sequence state is stored only at `sourceScript.contentData.cinematic_sequence`; script text remains unchanged and no new node, table, scheduler, or store is introduced.

## RED/GREEN

- Behavior RED sent a valid v2 `revid.cinematic-sequence` document through the existing text endpoint. The endpoint incorrectly validated it as legacy `CinematicShotSchemaDocument` and failed with exact extra/missing-field errors.
- GREEN selects the strict output schema by exact cinematic Skill version. V1 shot documents remain unchanged; v2 requires exact sequence source revision and exact submitted director brief.
- The compiler tells the text authority to return only strict sequence JSON without Markdown.

## Atomic Canvas planning

- `apply-cinematic-sequence` targets one script node, requires the original script content, reparses the strict sequence, rejects wrong source/locked/stale input, and updates only `contentData.cinematic_sequence`.
- One command queued one autosave boundary. Undo removed the sequence and redo restored it exactly.
- Malformed JSON/schema and wrong-source documents produce zero updates.
- Disclosure resolves only the first planned clip. A generated clip awaiting review blocks later execution; accepted/rejected earlier clips allow the next planned clip.

## Existing text authority

- The explicit planning method reuses authenticated capability/source loading, v2 preflight, existing text generation, task/asset lineage, and the Canvas command dispatcher.
- Planning can create one user-authorized text task. It creates no image/video task and performs no hidden generation.

## Verification

- Backend text authority plus existing v1/v2 handoff matrix: `19/19` passed.
- Frontend sequence/command/history plus related preflight/shot/command matrix: `21/21` passed.
- Production build: `4941 modules transformed`.

## Safety

- No real/paid call, credential, `.env`, external account, destructive action, migration, image/video task, provider adapter, or second persistence authority was used.
