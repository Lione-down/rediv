# REPORT-T5-063 - Contextual toolbar collision avoidance

- Result: `DONE - PASS`
- Date: 2026-07-15
- Dependency: T5-062 (`DONE - PASS`)

## Delivered

- Selection toolbar scoring now includes selected node content instead of considering only unrelated nodes.
- Video keyframe rail rendering and toolbar scoring share one deterministic above/below resolver, and the toolbar prefers the opposite side while scoring the rail's actual screen rect.
- Horizontal and vertical clamps honor existing Canvas viewport insets without double-reserving the external desktop Inspector.
- Toolbar bounds reflect action density: ordinary single selection, single generation, and multi-selection retain distinct conservative widths.
- Desktop selected-video controls remain within 72px of the media while avoiding the native video, keyframe rail, neighboring nodes, and Inspector boundary.
- Compact context drawers suppress the toolbar behind their overlay; Escape keeps the existing selection-clear behavior and emits no graph PATCH.
- Multi-selection, generation composer, arrange/compose menus, keyboard ownership, lineage fit, panel-safe reveal, and readonly behavior remain intact.

## Verification

- Focused video/keyframe and multi-scenario suite: PASS, 15/15.
- Related toolbar, command, generation provenance, keyboard, selection composition, reveal, and visual matrix: PASS, 60/60.
- Production build: PASS, 4,819 modules transformed.
- Browser geometry proves zero toolbar overlap with selected video and rail, at least 12px Inspector clearance, and no more than 72px contextual distance.
- Compact browser evidence proves zero toolbar under the drawer and zero PATCH after drawer dismissal.
- Visual evidence inspected:
  - `output/playwright/t5-062-video-keyframes/selected-keyframe-rail-1440x900.png`
  - `output/playwright/t5-062-video-keyframes/compact-drawer-owns-toolbar-920x760.png`
  - `output/playwright/t5-062-video-keyframes/compact-drawer-dismissed-920x760.png`
- Backend tests were not required because no API, persistence, provider, quota, or schema behavior changed.
- Diff, whitespace, file-size, sensitive-path, and staging-scope checks: PASS.

## Product result

Selection controls now read as part of the selected workflow without standing on top of its content. Dense desktop graphs retain local controls beside media and Inspector surfaces, while compact drawers present one unambiguous interaction layer.
