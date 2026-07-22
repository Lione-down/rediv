import { Buffer } from 'node:buffer'
import {
  FIRST_CANVAS_ID,
  PROJECT_ID,
  createResourceMockState,
  type ResourceMockState,
} from './canvas-resource-generation-fixture'

const NOW = '2026-07-21T08:00:00Z'

interface VisualNodeOptions {
  content: Record<string, unknown>
  height: number
  id: string
  status?: string
  title: string
  type: string
  width: number
  x: number
  y: number
}

function visualNode(options: VisualNodeOptions) {
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
    z_index: 0,
    parent_node_id: null,
    is_locked: false,
    is_collapsed: false,
    status: options.status ?? 'idle',
    created_at: NOW,
    updated_at: NOW,
  }
}

function visualEdge(id: string, sourceNodeId: string, targetNodeId: string, targetPort: 'in' | 'media' | 'prompt') {
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

function cinematicSvg(palette: readonly [string, string, string, string], label: string) {
  const [sky, glow, ridge, foreground] = palette
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${sky}"/><stop offset="1" stop-color="${glow}"/></linearGradient></defs>
    <rect width="640" height="360" rx="18" fill="url(#sky)"/>
    <circle cx="475" cy="112" r="52" fill="#fff4cf" opacity=".76"/>
    <path d="M0 250 105 155l74 67 105-127 92 105 67-68 197 143v85H0Z" fill="${ridge}" opacity=".9"/>
    <path d="M0 286c102-34 177-21 246 6 94 37 194 3 394-33v101H0Z" fill="${foreground}"/>
    <path d="M360 273c12-42 32-72 57-72 25 0 47 31 59 72l-24 87h-73Z" fill="#211d2a" opacity=".9"/>
    <text x="26" y="326" fill="white" opacity=".78" font-family="sans-serif" font-size="15" letter-spacing="2">${label}</text>
  </svg>`, 'utf8')
}

export const T6_VISUAL_NODE_IDS = [
  'visual-script-a', 'visual-note-a', 'visual-reference-top', 'visual-script-b', 'visual-brief-b',
  'visual-selected', 'visual-script-c', 'visual-note-c', 'visual-generation', 'visual-final',
] as const

export function createT6VisualConvergenceState(): ResourceMockState {
  const state = createResourceMockState()
  const selectedUrl = 'https://media.revid.test/t6-003-selected.svg'
  const topUrl = 'https://media.revid.test/t6-003-reference.svg'
  const finalUrl = 'https://media.revid.test/t6-003-final.svg'
  state.capturedFrames['/t6-003-selected.svg'] = cinematicSvg(['#4a355c', '#d58e68', '#49324f', '#181622'], 'CHARACTER REFERENCE')
  state.capturedFrames['/t6-003-reference.svg'] = cinematicSvg(['#24344f', '#8396a1', '#33445a', '#121b27'], 'ENVIRONMENT REFERENCE')
  state.capturedFrames['/t6-003-final.svg'] = cinematicSvg(['#5b3a48', '#d6a45f', '#563a3b', '#1e1820'], 'FINAL SHOT')

  state.assets.find((asset) => asset.id === 'asset-reference')!.url = topUrl
  state.assets.find((asset) => asset.id === 'asset-generated')!.url = selectedUrl
  state.assets.push({
    ...state.assets.find((asset) => asset.id === 'asset-generated')!,
    id: 'asset-t6-final',
    canvas_node_id: 'visual-final',
    url: finalUrl,
    source_task_id: 'task-t6-final',
  })

  state.documents[FIRST_CANVAS_ID] = {
    nodes: [
      visualNode({ id: 'visual-script-a', type: 'script', title: '开场脚本', x: 40, y: 90, width: 320, height: 200, content: { subtype: 'script', serialization_version: 1, text: '薄雾山谷，建立环境与人物距离。' } }),
      visualNode({ id: 'visual-note-a', type: 'note', title: '光线说明', x: 400, y: 90, width: 260, height: 180, content: { subtype: 'annotation', serialization_version: 1, text: '冷色环境光，保留远山层次。' } }),
      visualNode({ id: 'visual-reference-top', type: 'asset', title: '环境参考', x: 730, y: 10, width: 320, height: 180, content: { subtype: 'image', serialization_version: 1, asset_id: 'asset-reference', project_id: PROJECT_ID, url: topUrl, width: 640, height: 360, aspect_ratio: 16 / 9 } }),
      visualNode({ id: 'visual-script-b', type: 'script', title: '人物脚本', x: 40, y: 330, width: 320, height: 200, content: { subtype: 'script', serialization_version: 1, text: '人物转身看向落日，镜头缓慢靠近。' } }),
      visualNode({ id: 'visual-brief-b', type: 'script', title: '分镜说明', x: 400, y: 330, width: 320, height: 200, content: { subtype: 'prompt', serialization_version: 1, text: '中景，侧逆光，保持人物身份一致。' } }),
      visualNode({ id: 'visual-selected', type: 'result', title: '人物主参考', x: 730, y: 290, width: 320, height: 180, status: 'success', content: { subtype: 'image', serialization_version: 1, asset_id: 'asset-generated', project_id: PROJECT_ID, source_task_id: 'task-existing-success', url: selectedUrl, width: 640, height: 360, aspect_ratio: 16 / 9 } }),
      visualNode({ id: 'visual-script-c', type: 'script', title: '收束脚本', x: 40, y: 650, width: 320, height: 200, content: { subtype: 'script', serialization_version: 1, text: '人物进入远景，结束在山谷余晖。' } }),
      visualNode({ id: 'visual-note-c', type: 'note', title: '节奏备注', x: 400, y: 650, width: 260, height: 180, content: { subtype: 'annotation', serialization_version: 1, text: '结尾停留两秒，避免突然切断。' } }),
      visualNode({ id: 'visual-generation', type: 'generation', title: '生成视频', x: 1110, y: 300, width: 340, height: 220, content: { subtype: 'video', serialization_version: 1, text: '生成连续的电影感镜头。' } }),
      visualNode({ id: 'visual-final', type: 'result', title: '结果 03', x: 1530, y: 310, width: 320, height: 180, status: 'success', content: { subtype: 'image', serialization_version: 1, asset_id: 'asset-t6-final', project_id: PROJECT_ID, source_task_id: 'task-t6-final', url: finalUrl, width: 640, height: 360, aspect_ratio: 16 / 9 } }),
    ],
    connections: [
      visualEdge('visual-edge-script-brief', 'visual-script-a', 'visual-brief-b', 'in'),
      visualEdge('visual-edge-script-generation', 'visual-script-b', 'visual-generation', 'prompt'),
      visualEdge('visual-edge-brief-generation', 'visual-brief-b', 'visual-generation', 'prompt'),
      visualEdge('visual-edge-closing-generation', 'visual-script-c', 'visual-generation', 'prompt'),
      visualEdge('visual-edge-reference-generation', 'visual-reference-top', 'visual-generation', 'media'),
      visualEdge('visual-edge-selected-generation', 'visual-selected', 'visual-generation', 'media'),
      visualEdge('visual-edge-generation-final', 'visual-generation', 'visual-final', 'in'),
    ],
  }
  return state
}
