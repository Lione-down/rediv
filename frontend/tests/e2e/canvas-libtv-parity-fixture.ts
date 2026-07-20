import { createMultiScenarioState } from './canvas-multi-scenario-fixture'
import { FIRST_CANVAS_ID, PROJECT_ID, type ResourceMockState } from './canvas-resource-generation-fixture'

const NOW = '2026-07-20T08:00:00Z'

interface ParityNodeOptions {
  content: Record<string, unknown>
  height: number
  id: string
  parentId?: string | null
  title: string
  type: string
  width: number
  x: number
  y: number
}

function parityNode(options: ParityNodeOptions) {
  return {
    id: options.id,
    project_id: PROJECT_ID,
    canvas_id: FIRST_CANVAS_ID,
    node_type: options.type,
    content: { title: options.title, ...options.content },
    position_x: options.x,
    position_y: options.y,
    width: options.width,
    height: options.height,
    z_index: options.type === 'group' ? -1 : 0,
    parent_node_id: options.parentId ?? null,
    is_locked: false,
    is_collapsed: false,
    status: 'idle',
    created_at: NOW,
    updated_at: NOW,
  }
}

function parityEdge(id: string, sourceNodeId: string, targetNodeId: string, targetPort = 'media') {
  return {
    id,
    project_id: PROJECT_ID,
    canvas_id: FIRST_CANVAS_ID,
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    source_port: 'out',
    target_port: targetPort,
    status: 'active',
    metadata: {},
    created_at: NOW,
    updated_at: NOW,
  }
}

/**
 * Lawful deterministic graph for T5-096 comparison.
 *
 * It reproduces only observable graph grammar and density: media-first nodes,
 * external labels, one observed three-node group, branching edges, a script surface, an empty
 * media state, video, landscape, square, and portrait ratios. Official media,
 * copy, identifiers, and private implementation details are not copied.
 */
export function createLibTvParityState(): ResourceMockState {
  const state = createMultiScenarioState()
  const nodes = [
    parityNode({
      id: 'parity-environment', type: 'asset', title: '环境参考', x: 386, y: 648, width: 340, height: 190,
      content: { subtype: 'image', serialization_version: 1, asset_id: 'asset-reference', url: 'https://media.revid.test/landscape-source.png', width: 340, height: 170, aspect_ratio: 16 / 9 },
    }),
    parityNode({
      id: 'parity-character-main', type: 'result', title: '角色主参考', x: 844, y: 652, width: 340, height: 190,
      content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/landscape-result.png', width: 340, height: 190, aspect_ratio: 16 / 9 },
    }),
    parityNode({
      id: 'parity-character-turnaround', type: 'result', title: '角色三视图', x: 844, y: 908, width: 340, height: 190,
      content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/landscape-source.png', width: 340, height: 190, aspect_ratio: 16 / 9 },
    }),
    parityNode({
      id: 'parity-character-variant', type: 'result', title: '角色造型变体', x: 844, y: 1148, width: 340, height: 190,
      content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/landscape-result.png', width: 340, height: 190, aspect_ratio: 16 / 9 },
    }),
    parityNode({
      id: 'parity-scene-result', type: 'result', title: '场景结果', x: 1315, y: 656, width: 356, height: 200,
      content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/landscape-source.png', width: 356, height: 200, aspect_ratio: 16 / 9 },
    }),
    parityNode({
      id: 'parity-video-result', type: 'result', title: '动态镜头', x: 1333, y: 1005, width: 340, height: 190,
      content: { subtype: 'video', serialization_version: 1, url: 'https://media.revid.test/scenario.mp4', preview_url: 'https://media.revid.test/landscape-poster.png', width: 340, height: 190, aspect_ratio: 16 / 9 },
    }),
    parityNode({
      id: 'parity-empty-media', type: 'asset', title: '待补充媒体', x: 1747, y: 255, width: 341, height: 193,
      content: { subtype: 'image', serialization_version: 1 },
    }),
    parityNode({
      id: 'parity-large-group', type: 'group', title: '组合创作区', x: 1727, y: 648, width: 1073, height: 600,
      content: { subtype: 'group', serialization_version: 1 },
    }),
    parityNode({
      id: 'parity-group-script', type: 'script', title: '镜头脚本', x: 2153, y: 690, width: 193, height: 260, parentId: 'parity-large-group',
      content: { subtype: 'script', serialization_version: 1, text: '人物进入室内，镜头保持连贯并延续环境光方向。'.repeat(8) },
    }),
    parityNode({
      id: 'parity-group-reference', type: 'result', title: '组合参考', x: 1757, y: 973, width: 256, height: 256, parentId: 'parity-large-group',
      content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/parity-reference.png', width: 225, height: 300, aspect_ratio: 3 / 4 },
    }),
    parityNode({
      id: 'parity-group-output', type: 'result', title: '组合输出', x: 2577, y: 804, width: 256, height: 256, parentId: 'parity-large-group',
      content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/parity-output.png', width: 225, height: 300, aspect_ratio: 3 / 4 },
    }),
  ]
  const connections = [
    parityEdge('parity-edge-environment-main', 'parity-environment', 'parity-character-main', 'in'),
    parityEdge('parity-edge-main-turnaround', 'parity-character-main', 'parity-character-turnaround'),
    parityEdge('parity-edge-main-variant', 'parity-character-main', 'parity-character-variant'),
    parityEdge('parity-edge-main-scene', 'parity-character-main', 'parity-scene-result'),
    parityEdge('parity-edge-turnaround-scene', 'parity-character-turnaround', 'parity-scene-result'),
    parityEdge('parity-edge-main-video', 'parity-character-main', 'parity-video-result'),
    parityEdge('parity-edge-variant-video', 'parity-character-variant', 'parity-video-result'),
    parityEdge('parity-edge-scene-script', 'parity-scene-result', 'parity-group-script', 'prompt'),
    parityEdge('parity-edge-scene-reference', 'parity-scene-result', 'parity-group-reference'),
    parityEdge('parity-edge-script-output', 'parity-group-script', 'parity-group-output', 'prompt'),
    parityEdge('parity-edge-reference-output', 'parity-group-reference', 'parity-group-output'),
  ]
  state.documents[FIRST_CANVAS_ID] = { nodes, connections }
  return state
}
