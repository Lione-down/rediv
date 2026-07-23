import { expect, test } from '@playwright/test'
import type { CanvasNode } from '../../src/types/canvas'
import { resolveStoryboardAssetGroupPresentation } from '../../src/modules/canvas/storyboard-asset-group-presentation'

function node(id: string, type: string, contentData: Record<string, unknown>, parentNodeId?: string): CanvasNode {
  return {
    id, type, title: id, content: '', contentData,
    x: 0, y: 0, width: 320, height: 180, zIndex: 0,
    isLocked: false, parentNodeId,
  }
}

test('asset-group presentation derives honest role scene prop and shot sections from canonical nodes', () => {
  const group = node('group', 'group', {
    subtype: 'storyboard', storyboard_kind: 'shot-plan', ordered_child_ids: ['generation-2', 'generation-1'],
    story_structure: '建立、发展与收束', character_consistency: '保持主角身份与服装',
  })
  const nodes = [
    group,
    node('generation-1', 'generation', { subtype: 'image', shot_id: 'shot-01', shot_title: '到站' }, 'group'),
    node('generation-2', 'generation', { subtype: 'image', shot_id: 'shot-02', shot_title: '登车' }, 'group'),
    node('prompt-1', 'script', {
      subtype: 'prompt', shot_id: 'shot-01', shot_characters: ['主角', '列车员'], shot_scene: '雨夜站台',
    }),
    node('prompt-2', 'script', {
      subtype: 'prompt', shot_id: 'shot-02', shot_characters: ['主角'], shot_scene: '列车车厢',
    }),
  ]

  expect(resolveStoryboardAssetGroupPresentation(group, nodes)).toEqual({
    characterConsistency: '保持主角身份与服装',
    isAssetGroup: true,
    propAssets: [],
    props: [],
    propsAvailable: false,
    roleAssets: [
      { kind: 'role', name: '主角', promptNodeIds: ['prompt-2', 'prompt-1'], shotIds: ['shot-02', 'shot-01'] },
      { kind: 'role', name: '列车员', promptNodeIds: ['prompt-1'], shotIds: ['shot-01'] },
    ],
    roles: ['主角', '列车员'],
    sceneAssets: [
      { kind: 'scene', name: '列车车厢', promptNodeIds: ['prompt-2'], shotIds: ['shot-02'] },
      { kind: 'scene', name: '雨夜站台', promptNodeIds: ['prompt-1'], shotIds: ['shot-01'] },
    ],
    scenes: ['列车车厢', '雨夜站台'],
    shots: [
      { id: 'generation-2', promptNodeId: 'prompt-2', shotId: 'shot-02', title: '登车' },
      { id: 'generation-1', promptNodeId: 'prompt-1', shotId: 'shot-01', title: '到站' },
    ],
    storyStructure: '建立、发展与收束',
  })
})

test('asset-group presentation reads future canonical shot props but ignores malformed values', () => {
  const group = node('group', 'group', {
    subtype: 'storyboard', storyboard_kind: 'shot-plan', ordered_child_ids: ['generation-1'],
  })
  const nodes = [
    group,
    node('generation-1', 'generation', { subtype: 'image', shot_id: 'shot-01', shot_title: '道具特写' }, 'group'),
    node('prompt-1', 'script', {
      subtype: 'prompt', shot_id: 'shot-01', shot_characters: ['主角', '', 7], shot_scene: '仓库', shot_props: ['银色手提箱', '胶卷', '', 9],
    }),
  ]

  const presentation = resolveStoryboardAssetGroupPresentation(group, nodes)
  expect(presentation.roles).toEqual(['主角'])
  expect(presentation.scenes).toEqual(['仓库'])
  expect(presentation.props).toEqual(['银色手提箱', '胶卷'])
  expect(presentation.propsAvailable).toBe(true)
})
