# T6-003 Static Design Baseline

- State: `ACCEPTED`.
- Generated at: `2026-07-21`, Asia/Shanghai.
- Tool path: built-in `imagegen` Skill / built-in image generation tool; no API key, paid external video call, or provider account was used.
- Use case: `ui-mockup`.
- Reference basis: [official-reference-baseline-2026-07-21](official-reference-baseline-2026-07-21.md).
- Design authority: intent only. Official visible behavior plus deterministic Revid browser/runtime evidence remain implementation acceptance authority.

## Artifacts

Both artifacts remain untracked under `output/t6-003/design-preview/` and are excluded from Git delivery.

| Artifact | Dimensions | SHA-256 | Role |
|---|---:|---|---|
| `revid-canvas-card-interaction-static-v1.png` | `1586 x 992` | `B3948857F9A19BB281A3189D825DFE883927FE99245FD4AF68B2FB94A6FD41D3` | Original built-in output |
| `revid-canvas-card-interaction-static-v1-1440x900.png` | `1440 x 900` | `D2881B12B17B5653AFDCE5EA6D09A257F00C44EFE9B1EB94CACD343A81BC9A1F` | Exact Human approval frame; Lanczos-only dimension normalization from the original |

The original aspect ratio was already effectively `1.6:1`; exact-size normalization changes no content or layout intent.

## Prompt

```text
Use case: ui-mockup
Asset type: T6-003 static design approval frame for the Revid desktop Canvas
Primary request: Create one exact 1440x900 high-fidelity, production-realistic desktop application UI screenshot of Revid's infinite creative Canvas. This is a design intent frame, not concept art.
Scene/backdrop: edge-to-edge graphite-black Canvas workspace with a subtle sparse dot grid, no browser chrome and no fake operating-system frame.
Product identity: original Revid UI only; dark graphite surfaces with restrained semantic violet emphasis, clear white/gray Chinese typography, precise spacing, crisp 1px outlines, mature professional video-creation software.
Composition/framing: full 1440x900 Canvas view. A compact top project/canvas bar, a quiet left tool rail, and unobtrusive zoom/minimap controls. The main graph should occupy most of the frame and remain easy to inspect.
Required graph content: show realistic script/note authoring cards, two image media cards, one video media card, one generation card, one result card, and one subtle group container. Arrange them into several connected left-to-right branches with smooth cubic Bezier edges. Media itself is the visible card body; media title and resolution sit externally above the media boundary. Keep authoring card headers/body/status readable.
Selected state: select exactly one central media card. Give it a precise 1.5px violet outline and a restrained violet-tinted outer shadow without moving or scaling it. Reveal relevant round connection ports centered exactly on current card boundaries; visible dots are approximately 20px and quiet except compatible ports. Show one selected edge with a localized violet directional flow cue but no persistent arrowheads; idle edges are thin and still.
Contextual UI: attach a compact lawful media toolbar directly above the selected source and a compact prompt/composer panel directly below it, both source-attached and collision-safe. Show a small multi-selection/group feedback region elsewhere without covering source media.
Text (verbatim where present): "Revid", "主画布", "脚本", "分镜说明", "参考图", "生成视频", "结果 03", "1920 x 1080", "选择模型", "发送". Use only these short labels where helpful; avoid extra paragraphs or garbled decorative copy.
Visual details: card/media radius about 12px, idle cards no drop shadow, selected media subtle outer shadow, quiet idle ports, visible compatible ports, 2px idle edges, clean endpoint landing, deterministic source-attached surfaces. Include a mix of cinematic landscape imagery and one portrait reference while maintaining original lawful imagery.
Constraints: preserve Revid graphite/violet identity; no LibTV name, logo, branding, proprietary icons, copied prompt text, copied media, or Director/导演台; no glassmorphism, no neon overload, no decorative 3D perspective, no gradients used as large decorative panels, no fake controls, no floating disconnected cards, no edge endpoint drift, no tiny illegible dense text, no watermark.
Avoid: generic dashboard layout, website hero, sci-fi HUD, bright blue primary palette, massive sidebars, excessive bloom, permanent port clutter, persistent arrowheads, card scaling on selection, visual noise.
```

## Human decision gate

- Current decision: `ACCEPTED`.
- Decision date: `2026-07-21`, Asia/Shanghai.
- Human decision: `就这个方向好了`.
- Accepted scope: card hierarchy, selected violet treatment, source-attached toolbar/composer, `20px` visible ports, quiet idle edges, and localized selected-edge flow shown by the exact `1440 x 900` frame.
- Approval question: accept this frame as the implementation direction for T6-003 card hierarchy, selected violet treatment, source-attached toolbar/composer, 20px visible ports, quiet idle edges, and localized selected-edge flow?
- Implementation authority: proceed through deterministic RED contracts before each product-code change; the still remains design intent rather than runtime completion evidence.
- External 15-second motion preview remains blocked unless the Human Owner separately authorizes that external call class and a maximum spend.
