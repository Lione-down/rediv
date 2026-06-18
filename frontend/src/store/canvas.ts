import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { CanvasConnection, CanvasNode } from '../types/canvas'

export const useCanvasStore = defineStore('canvas', () => {
  const selectedNodeId = ref('node-2')
  const mode = ref<'select' | 'hand' | 'text' | 'image' | 'generate'>('select')
  const viewport = ref({ zoom: 1, x: 0, y: 0 })
  const nodes = ref<CanvasNode[]>([
    {
      id: 'node-1',
      type: 'text',
      title: '故事脚本',
      x: 110,
      y: 130,
      width: 220,
      height: 112,
      content: '一位旅行者在雨夜找到会发光的旧车站。',
    },
    {
      id: 'node-2',
      type: 'image',
      title: '角色参考',
      x: 420,
      y: 92,
      width: 230,
      height: 132,
      status: 'selected',
      content: '上传图片或生成视觉锚点。',
    },
    {
      id: 'node-3',
      type: 'model',
      title: 'Agnes Image',
      x: 740,
      y: 148,
      width: 230,
      height: 126,
      status: 'running',
      content: '根据脚本和角色参考生成关键帧。',
    },
    {
      id: 'node-4',
      type: 'video',
      title: '视频结果',
      x: 1070,
      y: 116,
      width: 236,
      height: 140,
      status: 'success',
      content: '等待进入 Agnes-Video-V2.0。',
    },
  ])
  const connections = ref<CanvasConnection[]>([
    { id: 'edge-1', from: 'node-1', to: 'node-3' },
    { id: 'edge-2', from: 'node-2', to: 'node-3', active: true },
    { id: 'edge-3', from: 'node-3', to: 'node-4' },
  ])

  const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedNodeId.value) || null)

  function selectNode(nodeId: string) {
    selectedNodeId.value = nodeId
  }

  function setMode(nextMode: typeof mode.value) {
    mode.value = nextMode
  }

  return {
    selectedNodeId,
    selectedNode,
    mode,
    viewport,
    nodes,
    connections,
    selectNode,
    setMode,
  }
})
