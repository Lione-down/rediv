# T5-096 Revid Visible-control Inventory

- Date: `2026-07-20`
- State: `DONE_PASS_WITH_DECLARED_BOUNDARIES`
- Rule: every visible action routes to a native authority or exposes an accessible disabled/unavailable reason; disclosure alone is mutation-free.

| Surface | Visible inventory | Authority/outcome | Deterministic evidence |
|---|---|---|---|
| Empty starters | `故事脚本生成`, `角色三视图`, `首帧图生视频`, `音频生视频` | Canonical insert-graph or explicit preflight; no hidden provider call | `canvas-empty-grid.spec.ts`, `canvas-libtv-shell-parity.spec.ts` |
| Add menu | Text, image, video, video synthesis, audio, script, asset library, upload, generation history; exactly 9 | Canonical node/resource/upload/preflight owners; Director absent by Human scope | `canvas-libtv-three-axis-parity.spec.ts` |
| Empty media placeholder | Placeholder content only; no node-local upload/recovery strip | Upload remains one level away in Add/添加资源, matching the official guide/Add ownership and avoiding duplicate visible chrome | `canvas-libtv-three-axis-parity.spec.ts`, `canvas-libtv-visual-parity.spec.ts` |
| Fixed shell | project/Canvas identity, Workflow/Storyboard, revision/sync, account, zoom/view, rail, minimap | Existing route, document, auth, viewport, and Canvas authorities | `authenticated-workflow.spec.ts`, `canvas-shell-navigation.spec.ts`, `logout-session.spec.ts` |
| Contextual disclosures | revision, resources/history, Palette, compare, workflow, video/audio, Agent/Skill, compact context | One exclusive coordinator; Escape/outside/focus restoration; zero disclosure PATCH | `canvas-libtv-three-axis-parity.spec.ts`, full functional run `532/532` |
| Media operations | select, preview/playback, toolbar, compare, capture, image operations, retry/error | Native media/asset/result owners; unsupported/failed paths are visibly bounded | `canvas-image-operations.spec.ts`, `canvas-video-node-playback.spec.ts`, `canvas-video-frame-capture.spec.ts` |
| Model/Skill/provider/cost | model selector, Skill mentions, parameters, acknowledgement, Send/retry | Capability/preflight/quota/task/result authorities; unavailable execution is explicit | `canvas-generation-parameters.spec.ts`, `canvas-cinematic-skills.spec.ts`, `canvas-agent-skill-contract.spec.ts` |
| Professional Palette | 29 registered actions listed in `revid-extension-map.md` | Typed command or named preflight; no generic execution fallback | `canvas-professional-action-registry.spec.ts`, `canvas-professional-action-palette.spec.ts` |
| 375x812 review boundary | navigation/review only; mutating actions removed | Read-only command gate | `canvas-performance-accessibility.spec.ts`, `canvas-shell-navigation.spec.ts` |

Director/`导演台` is not a visible-control row. It is `HUMAN_EXCLUDED_NOT_APPLICABLE` and has no Revid implementation, entry, placeholder, imitation, disabled action, or parity counter.
