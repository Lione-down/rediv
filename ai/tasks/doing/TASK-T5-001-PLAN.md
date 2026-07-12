# T5-001 Plan: V2 documentation and architecture baseline

Last updated: 2026-07-12

## Objective

Produce one coherent, approved V2 document system from the Human Owner decisions, live competitor benchmark, repository facts, and current implementation risks.

## Workstreams

1. Reconstruct Phase 4 completion state and protect the dirty worktree.
2. Audit current backend database/runtime/schema surfaces without opening secrets.
3. Audit current frontend theme, Canvas engine, stores, renderer, interactions, and tests.
4. Translate confirmed decisions into PRD, Canvas acceptance, design system, architecture, and ADRs.
5. Create the Phase 5 roadmap and activate the first dependency-ready implementation Task.
6. Reconcile CURRENT, document lifecycle READMEs, root navigation, and pitfalls.
7. Run link, terminology, encoding, secret, diff, and staged-diff review before a docs-only commit.

## Chosen Approach

- keep Phase 4 evidence immutable;
- treat Product V2 as Phase 5;
- separate product, acceptance, visual, architecture, decision, execution, and report concerns into linked documents;
- keep Leafer UI and the existing application stack;
- make MySQL-only retirement the first implementation Task because Canvas schema work must not build on a fallback database contract;
- make the Canvas milestone pass before global page redesign.

## Risk Controls

- do not read `.env` or the candidate hard-coded credential value;
- do not claim V2 target behavior is already implemented;
- do not delete SQLite artifacts or mutate MySQL;
- protect the 45 pre-existing `.playwright-cli/*.yml` files and `output/`;
- record the credential code cleanup and Human rotation gate separately;
- avoid placeholders or undecided implementation contracts.

## Verification

- Markdown link target existence check;
- required-section and forbidden-placeholder scan;
- UTF-8 decode scan for changed Markdown;
- redacted credential-pattern scan for changed and staged documents;
- `git diff --check` and `git diff --cached --check`;
- fresh review of CURRENT, ROADMAP, Task, PLAN, PROGRESS, REPORT, ADR, PRD, architecture, and design consistency.
