import { FIRST_CANVAS_ID, PROJECT_ID, createResourceMockState, type ResourceMockState } from './canvas-resource-generation-fixture'

const NOW = '2026-07-15T08:00:00Z'

interface ScenarioNodeOptions {
  content: Record<string, unknown>
  height?: number
  isLocked?: boolean
  status?: string
  title: string
  type: string
  width?: number
  x: number
  y: number
}

function scenarioNode(id: string, options: ScenarioNodeOptions) {
  return {
    id,
    project_id: PROJECT_ID,
    canvas_id: FIRST_CANVAS_ID,
    node_type: options.type,
    content: { title: options.title, ...options.content },
    position_x: options.x,
    position_y: options.y,
    width: options.width ?? (options.type === 'generation' ? 340 : 320),
    height: options.height ?? (options.type === 'generation' ? 220 : 200),
    z_index: 0,
    parent_node_id: null,
    is_locked: options.isLocked ?? false,
    is_collapsed: false,
    status: options.status ?? 'idle',
    created_at: NOW,
    updated_at: NOW,
  }
}

function scenarioEdge(
  id: string,
  sourceNodeId: string,
  targetNodeId: string,
  sourcePort: string,
  targetPort: string,
) {
  return {
    id,
    project_id: PROJECT_ID,
    canvas_id: FIRST_CANVAS_ID,
    source_node_id: sourceNodeId,
    target_node_id: targetNodeId,
    source_port: sourcePort,
    target_port: targetPort,
    status: 'active',
    metadata: {},
    created_at: NOW,
    updated_at: NOW,
  }
}

export function createMultiScenarioState(): ResourceMockState {
  const state = createResourceMockState()
  state.documents[FIRST_CANVAS_ID] = {
    nodes: [
      scenarioNode('script-cn', {
        type: 'script', title: '中文剧情约束', x: 40, y: 40,
        content: { subtype: 'script', serialization_version: 1, text: '黄昏后的海岸，人物从画面左侧进入。保持低饱和电影质感，镜头运动平缓，人物服装与光线方向在所有结果中保持一致。' },
      }),
      scenarioNode('script-en', {
        type: 'script', title: 'Cinematic direction with deliberately long English content', x: 40, y: 230,
        content: { subtype: 'prompt', serialization_version: 1, text: 'A restrained cinematic sequence with consistent wardrobe, soft coastal haze, practical lighting, and a slow lateral camera move that preserves screen direction across every generated shot.' },
        isLocked: true,
      }),
      scenarioNode('asset-landscape', {
        type: 'asset', title: '海岸环境参考', x: 420, y: 20,
        content: { subtype: 'image', serialization_version: 1, asset_id: 'asset-reference', url: 'https://media.revid.test/landscape-source.png', width: 320, height: 180 },
      }),
      scenarioNode('asset-portrait', {
        type: 'asset', title: '人物造型参考', x: 480, y: 270,
        content: { subtype: 'image', serialization_version: 1, asset_id: 'asset-character', url: 'https://media.revid.test/portrait-source.png', width: 180, height: 320 },
      }),
      scenarioNode('generation-compose', {
        type: 'generation', title: '合并四路上下文生成', x: 800, y: 175,
        content: { subtype: 'image', serialization_version: 1, text: '合并剧情、镜头、环境和人物参考。', generation_status: 'running', generation_task_id: 'task-scenario-running' },
      }),
      scenarioNode('result-landscape', {
        type: 'result', title: '宽银幕主镜头', x: 1160, y: 0, status: 'success',
        content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/landscape-result.png', width: 320, height: 180 },
      }),
      scenarioNode('result-square', {
        type: 'result', title: '方形社交版本', x: 1160, y: 250, status: 'success',
        content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/square-result.png', width: 240, height: 240 },
      }),
      scenarioNode('result-portrait', {
        type: 'result', title: '竖屏人物版本', x: 1540, y: 0, status: 'success',
        content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/portrait-result.png', width: 180, height: 320 },
      }),
      scenarioNode('result-video', {
        type: 'result', title: '动态镜头结果', x: 1480, y: 390, status: 'success',
        content: { subtype: 'video', serialization_version: 1, url: 'https://media.revid.test/scenario.mp4', preview_url: 'https://media.revid.test/landscape-poster.png', width: 160, height: 90 },
      }),
      scenarioNode('result-unavailable', {
        type: 'result', title: '上游返回空结果', x: 1160, y: 590, status: 'warning',
        content: { subtype: 'image', serialization_version: 1 },
      }),
      scenarioNode('result-broken', {
        type: 'result', title: '损坏媒体结果', x: 1540, y: 650, status: 'warning',
        content: { subtype: 'image', serialization_version: 1, url: 'https://media.revid.test/broken-result.png', width: 320, height: 180 },
      }),
    ],
    connections: [
      scenarioEdge('edge-cn-prompt', 'script-cn', 'generation-compose', 'out', 'prompt'),
      scenarioEdge('edge-en-prompt', 'script-en', 'generation-compose', 'out', 'prompt'),
      scenarioEdge('edge-landscape-media', 'asset-landscape', 'generation-compose', 'out', 'media'),
      scenarioEdge('edge-portrait-media', 'asset-portrait', 'generation-compose', 'out', 'media'),
      scenarioEdge('edge-result-landscape', 'generation-compose', 'result-landscape', 'out', 'in'),
      scenarioEdge('edge-result-square', 'generation-compose', 'result-square', 'out', 'in'),
      scenarioEdge('edge-result-portrait', 'generation-compose', 'result-portrait', 'out', 'in'),
      scenarioEdge('edge-result-video', 'generation-compose', 'result-video', 'out', 'in'),
      scenarioEdge('edge-result-unavailable', 'generation-compose', 'result-unavailable', 'out', 'in'),
      scenarioEdge('edge-result-broken', 'generation-compose', 'result-broken', 'out', 'in'),
    ],
  }
  state.assets.push({
    ...state.assets[0],
    id: 'asset-character',
    url: 'https://media.revid.test/portrait-source.png',
    content_text: '人物造型参考',
  })
  return state
}
