# Hermes Skill Inventory — Before Convergence

> Generated: 2026-07-04
> Purpose: Backup of current skill state before convergence cleanup
> Scope: All Hermes profiles for the Revid project

## Profile: default

- **Installed skills**: 94 (60 builtin + 34 local)
- **Source**: Global + local
- **Auto-loaded skills**: All enabled skills are auto-loaded on startup
- **Key excess skills**: ask-matt-mpp, codebase-audit, codebase-design-mpp, computer-use, dev-conventions, diagnosing-bugs-mpp, dispatcher-child-contract-bug, dogfood, domain-modeling-mpp, grill-mpp, handoff-mpp, hermes-execution-status-initialization, hermes-lang-config, implement-mpp, improve-architecture-mpp, kanban-multi-agent, mpp-project-orchestration, mysql-ddl-compatibility, project-management-workflow, project-master-controller, prototype-mpp, resolve-merge-conflicts-mpp, revid-project-workflow, tdd-matt-pocock, to-issues-mpp, to-prd-mpp, triage-mpp, claude-code, codex, hermes-agent, opencode, creative suite (23 skills), productivity suite (10 skills), research suite (4 skills), media suite (4 skills), mlops suite (4 skills), github suite (6 skills), note-taking (obsidian), smart-home (openhue), email (himalaya), data-science (jupyter), autonomous-ai-agents (claude-code, codex, hermes-agent, opencode), software-development (10 skills)
- **Target**: systematic-debugging only

## Profile: revid-dispatcher

- **Installed skills**: 70 (60 builtin + 10 local)
- **Source**: Global + local
- **Auto-loaded skills**: All enabled skills are auto-loaded on startup
- **Key excess skills**: claude-code, codex, hermes-agent, opencode, computer-use, dogfood, yuanbao, creative suite (23 skills), productivity suite (10 skills), research suite (4 skills), media suite (4 skills), mlops suite (4 skills), github suite (6 skills), note-taking (obsidian), smart-home (openhue), email (himalaya), data-science (jupyter), kanban-multi-agent, mpp-project-orchestration, project-management-workflow, project-master-controller, revid-project-workflow, ai-collaboration-setup, hermes-agent-skill-authoring, multi-agent-project-management, node-inspect-debugger, plan, requesting-code-review, simplify-code, spike, systematic-debugging, test-driven-development
- **Target**: 0 skills (NONE)
- **Config note**: disabled_toolsets already blocks autonomous-ai-agents, software-development, revid-project-workflow, project-management-workflow, project-master-controller, mpp-project-orchestration, kanban-multi-agent, creative, media, research, mlops, note-taking, productivity, smart-home, email, data-science, yuanbao, dogfood, computer-use. But individual skills are still enabled and load into context.

## Profile: revid-pm

- **Installed skills**: 70 (60 builtin + 10 local)
- **Source**: Global + local
- **Auto-loaded skills**: All enabled skills are auto-loaded on startup
- **Key excess skills**: Same as revid-dispatcher (70 skills)
- **Target**: 0 skills (NONE)
- **Config note**: disabled_toolsets already blocks autonomous-ai-agents, software-development, revid-project-workflow, project-management-workflow, project-master-controller, mpp-project-orchestration, kanban-multi-agent, creative, media, research, mlops, note-taking, productivity, smart-home, email, data-science, yuanbao, dogfood, computer-use, ask-matt-mpp, codebase-audit, codebase-design-mpp, diagnosing-bugs-mpp, domain-modeling-mpp, grill-mpp, handoff-mpp, implement-mpp, improve-architecture-mpp, jupyter-live-kernel, messaging-platform-integration, monitoring, note-taking, prototype-mpp, resolve-merge-conflicts-mpp, setup-mpp-skills, tdd-matt-pocock, to-issues-mpp, to-prd-mpp, triage-mpp, world-cup-ticket-monitor, email, data-science, creative, media, research. But individual skills are still enabled and load into context.

## Profile: revid-frontend

- **Installed skills**: 65 (60 builtin + 5 local)
- **Source**: Global + local
- **Auto-loaded skills**: All enabled skills are auto-loaded on startup
- **Excess skills**: claude-code, codex, hermes-agent, opencode, computer-use, dogfood, yuanbao, creative suite (23 skills), productivity suite (10 skills), research suite (4 skills), media suite (4 skills), mlops suite (4 skills), github suite (6 skills), note-taking (obsidian), smart-home (openhue), email (himalaya), data-science (jupyter), hermes-agent-skill-authoring, node-inspect-debugger, plan, requesting-code-review, simplify-code, spike, project-management-workflow, revid-project-workflow
- **Target**: systematic-debugging, test-driven-development (design and playwright are not real skills — they map to browser tool and are not skill-loadable)

## Profile: revid-backend

- **Installed skills**: 66 (60 builtin + 6 local)
- **Source**: Global + local
- **Auto-loaded skills**: All enabled skills are auto-loaded on startup
- **Excess skills**: claude-code, codex, hermes-agent, opencode, computer-use, dogfood, yuanbao, creative suite (23 skills), productivity suite (10 skills), research suite (4 skills), media suite (4 skills), mlops suite (4 skills), github suite (6 skills), note-taking (obsidian), smart-home (openhue), email (himalaya), data-science (jupyter), hermes-agent-skill-authoring, node-inspect-debugger, plan, requesting-code-review, simplify-code, spike, ai-collaboration-setup, project-management-workflow, revid-project-workflow
- **Target**: systematic-debugging, test-driven-development (fastapi-project-structure is not a real skill)

## Profile: revid-reviewer

- **Installed skills**: 66 (60 builtin + 6 local)
- **Source**: Global + local
- **Auto-loaded skills**: All enabled skills are auto-loaded on startup
- **Excess skills**: claude-code, codex, hermes-agent, opencode, computer-use, dogfood, yuanbao, creative suite (23 skills), productivity suite (10 skills), research suite (4 skills), media suite (4 skills), mlops suite (4 skills), github suite (6 skills), note-taking (obsidian), smart-home (openhue), email (himalaya), data-science (jupyter), hermes-agent-skill-authoring, node-inspect-debugger, plan, requesting-code-review, simplify-code, spike, task-deliverable-review, project-management-workflow, revid-project-workflow
- **Target**: 0 skills (check and playwright are not real skills — they map to terminal/read/search/browser tools)

## Skills NOT Found (referenced in whitelist but do not exist)

- `design` — does not exist as a skill
- `playwright` — does not exist as a skill (browser tool is built-in)
- `fastapi-project-structure` — does not exist as a skill
- `check` — does not exist as a skill
- `think` — does not exist as a skill
- `health` — does not exist as a skill
- `subagent-driven-development` — does not exist as a skill
- `browser:control-in-app-browser` — does not exist as a skill
- `kanban-orchestrator` — does not exist as a skill

## Config Files Referenced

- `C:/Users/mkd/AppData/Local/hermes/profiles/default/config.yaml`
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-dispatcher/config.yaml`
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-pm/config.yaml`
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-frontend/config.yaml`
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-backend/config.yaml`
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-reviewer/config.yaml`

## SOUL.md Files Referenced

- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-dispatcher/SOUL.md` — explicitly prohibits skills
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-pm/SOUL.md` — explicitly prohibits skills
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-frontend/SOUL.md` — references approved skills
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-backend/SOUL.md` — references approved skills
- `C:/Users/mkd/AppData/Local/hermes/profiles/revid-reviewer/SOUL.md` — references approved skills
