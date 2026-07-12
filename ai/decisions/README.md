# Revid Architecture Decision Records

本目录记录会影响数据、API、架构、部署或长期维护成本的决策。新实现必须遵守所有 `Accepted` ADR；若决策被替代，后续 ADR 必须明确指出替代范围。

## ADR Format

每份 ADR 至少包含：

- Status
- Context
- Decision
- Consequences
- Rollout 或 Migration
- Acceptance Gates
- Reversal 或 Rollback 边界

## Active Index

| ADR | Decision | Status |
|---|---|---|
| [ADR-001](ADR-001-local-mysql8-primary-database.md) | Local MySQL 8 primary database | Partially superseded by ADR-004 |
| [ADR-002](ADR-002-v3-1-technology-stack.md) | v3.1 technology stack | Accepted |
| [ADR-003](ADR-003-t4-002-disposable-mysql-test-environment.md) | T4-002 disposable MySQL test environment | Historical scope; test policy superseded by ADR-004 |
| [ADR-004](ADR-004-mysql-only-runtime-and-tests.md) | MySQL-only runtime and database-backed tests | Accepted |
| [ADR-005](ADR-005-project-multi-canvas.md) | A project owns multiple independent canvases | Accepted |
| [Direct Delivery](ADR-2026-07-10-CODEX-DIRECT-DELIVERY.md) | Codex direct delivery operating model | Accepted |

## V2 Decision Summary

- MySQL is the only database runtime, migration and database-backed test target.
- Project is the asset and generation boundary; Canvas is the graph editing boundary.
- A project can own multiple independent canvases.
- Multi-canvas migration is expand-first. Automatic downgrade is not supported after a second canvas exists.
- Real-time collaboration remains outside V2 first acceptance.

The implementation sequence is maintained in [`../state/ROADMAP.md`](../state/ROADMAP.md).
