# TASK-T5-095 - Canvas 主创作输入附件、发送与 Agnes capability 恢复

- State: `DONE - PASS`
- Objective: 修复 T5-094 用户验收暴露的主创作输入错误契约：附件必须先附着到 composer 而不是立即插入画布；发送必须进入真实的脚本写作流程而不是只创建 inert 本地节点；capability 加载必须有清晰状态和可恢复入口；交互层级、几何和状态反馈对齐 LibTV 可观察效果，仅保留 Revid 自有色彩基调。
- Dependency: `T5-094 - DONE - PASS` at `789397fe15b443ee66431955766070918ca1b637`.
- Activation baseline: `HEAD == origin/main == 789397fe15b443ee66431955766070918ca1b637`; no tracked changes; user-owned `.codex/`, `.hermes/plans/`, and `output/` remain outside scope.

## Confirmed defects

1. `附件` currently opens Project Resources in insert mode; choosing an asset mutates the graph and hides the empty-canvas composer.
2. `发送` is explicitly tested as a local-only node insertion with zero generation requests, so it cannot perform the script-writing action implied by the UI.
3. Script authoring renders internal text `capability 未加载`, disables the action, and offers no retry. A frontend v5/backend v4 runtime mismatch yields the same dead state without an actionable explanation.
4. T5-094 ledger row A10 classified control presence as parity without proving attachment, send, recovery, or failure-state interaction parity.

## Scope

1. Add an explicit composer attachment-selection mode to Project Resources; selecting/removing a resource changes composer state only and never inserts a graph node.
2. Route script-mode Send through the existing authenticated, quota-aware, durable script-authoring path using the selected canonical source node and mocked provider evidence.
3. Preserve brief and attachments across recoverable failure; show clear pending/success/error states and a bounded manual retry.
4. Expose capability loading, available, incompatible-runtime, and failed states with user-facing copy and a retry action; never display internal contract jargon.
5. Tighten main-composer hierarchy, spacing, attachment chips, model identity, button states, and focus behavior using existing Revid tokens.
6. Correct the parity ledger/scenario evidence so A10 requires interaction behavior, not only visible controls.

## Non-goals and Human gates

- No real or paid Agnes request, secret access, `.env` inspection, external-account mutation, destructive operation, migration, or provider-health claim.
- Do not weaken auth, quota, admission, idempotency, durable task/asset, autosave/history, or provider error boundaries.
- Do not copy LibTV private code or assets; use only Revid components, icons, and semantic colors.
- Do not stage `.codex/`, `.hermes/plans/`, `output/`, `.env*`, or unrelated files.

## Acceptance criteria

1. Selecting an attachment keeps the main composer visible, keeps graph node count unchanged, and presents an accessible removable attachment chip.
2. Script Send creates the canonical source atomically, invokes the existing script-authoring request only after persistence, and produces an editable lineage-bearing result under browser mocks.
3. Capability unavailable/incompatible states use clear product language, retain user input, and expose a bounded manual retry that can recover without page reload.
4. Provider failure never discards the source brief/attachment context or silently leaves an unusable control; no automatic unbounded retry is introduced.
5. Desktop and compact focus ownership, keyboard access, autosave/history, and exact-text preservation have focused browser evidence.
6. Focused tests pass before related regression and build; no real Agnes call occurs.
7. Task, PLAN, PROGRESS, CURRENT, ROADMAP, evidence, REPORT, commit, and `origin/main` agree before `DONE - PASS`.
