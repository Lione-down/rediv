# T6-003 Official LibTV Read-Only Reference Baseline

- Observed at: `2026-07-21`, Asia/Shanghai.
- Authority: official LibTV guide-published public read-only share.
- Source URL: `https://www.liblib.tv/canvas/share?shareId=W713Ltb3p`.
- Browser: user-authenticated Chrome through the supported browser control surface.
- CSS viewport: `1440 x 900`.
- Safety: read-only navigation, zoom, hover, media selection, and edge selection only. `复制项目`, uploads, generation, download, replacement, grouping mutation, prompt mutation, and paid actions were not invoked.
- Clean-room boundary: observations record visible behavior only; no private source, bundle, DOM contract, network contract, proprietary prompt, icon, font, media, or brand asset is copied.

## Current observations

| State | Preconditions and action | Visible result | Confidence |
|---|---|---|---|
| Populated overview | Open the guide-published share and settle at its fitted state | Readout is `28%`; media/result/authoring nodes, one three-node group, quiet curved edges, minimap/view controls, and external labels remain legible as roles | High |
| Media idle at 100% | Use the named `缩放至100%` preset and close the menu | Media is the visible node body; title and `2752 x 1536` resolution sit outside the body; idle media has no apparent drop shadow; incoming/outgoing edges land on the current visible media boundary | High |
| Media selected at 100% | Select the unique visible `参考生成图像` card without invoking actions | Source-attached detail opens directly below the media with three references and prompt detail; the media remains in place; external title/resolution and connected geometry remain stable | High |
| Card hover/read-only port disclosure | Move across the visible media body and its boundary | The public read-only share does not expose a mutable port-drag state in this sample; no persistent port clutter appears | Medium; interaction is bounded by read-only authority |
| Edge selection/read-only motion | Activate a visible accessible edge group | Selection clears the media detail without graph mutation; the share does not expose a reliable editable drag/flow state in this read-only sample | Medium; use prior lawful observable evidence plus local deterministic contracts for motion/drag |
| Zoom focus | Open the zoom disclosure, activate the named 100% preset, and use the zoom control again | The named numeric readout updates to `100%`; the control remains keyboard-addressable; menu closure is deterministic through its own disclosure | High |

## Persisted raw captures

Raw captures remain untracked under `output/t6-003/official-baseline/` and are excluded from Git delivery.

| Capture | Dimensions | SHA-256 |
|---|---:|---|
| `libtv-guide-share-overview-28pct-1440x900.png` | `1440 x 900` | `050407A012C9BDF367AF1CB3D80DF43B02D9D23E6ED92E16689BBF6589EF607D` |
| `libtv-guide-share-card-idle-100pct-1440x900.png` | `1440 x 900` | `258E3E0FCE50D1264B5D8F6A666F89058E1C1C9E574E7A641D4B702D50DE1573` |
| `libtv-guide-share-card-selected-100pct-1440x900.png` | `1440 x 900` | `22E29D8FE6609A910DDFA4EF519E4D4A8D14297C1DDC217DCF033B38BE0117CF` |

## Implementation implications

- Keep media-as-body and external title/resolution ownership; do not wrap media in a generic filled card shell.
- Keep idle surfaces and edges quiet with no permanent shadow, port clutter, or arrow marker.
- Keep contextual detail source-attached below the selected media and preserve current geometry during disclosure.
- Derive card body, external labels, selection, ports, edge endpoints, hit regions, toolbar, and composer from the current visible geometry.
- Port dragging and approximately three-second localized flow cannot be re-proven from this read-only sample. Use the prior lawful official observation boundary already retained by T5-096 and require new pure/browser RED contracts plus deterministic local implementation evidence; do not claim live mutable LibTV proof.
- Director is visible in the public share but remains Human-excluded and not applicable to Revid.
