import type { CanvasNode } from '../../types/canvas'

export interface StoryboardAssetGroupShot {
  id: string
  promptNodeId: string
  shotId: string
  title: string
}

export type StoryboardAssetKind = 'role' | 'scene' | 'prop'

export interface StoryboardAssetGroupAsset {
  kind: StoryboardAssetKind
  name: string
  promptNodeIds: string[]
  shotIds: string[]
}

export interface StoryboardAssetGroupPresentation {
  characterConsistency: string
  isAssetGroup: boolean
  props: string[]
  propAssets: StoryboardAssetGroupAsset[]
  propsAvailable: boolean
  roles: string[]
  roleAssets: StoryboardAssetGroupAsset[]
  scenes: string[]
  sceneAssets: StoryboardAssetGroupAsset[]
  shots: StoryboardAssetGroupShot[]
  storyStructure: string
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const normalized = stringValue(item)
    return normalized ? [normalized] : []
  })
}

function appendUnique(target: string[], values: readonly string[]) {
  for (const value of values) if (!target.includes(value)) target.push(value)
}

export function resolveStoryboardAssetGroupPresentation(
  group: CanvasNode,
  nodes: readonly CanvasNode[],
): StoryboardAssetGroupPresentation {
  const content = group.contentData ?? {}
  const isAssetGroup = group.type === 'group' && content.storyboard_kind === 'shot-plan'
  const empty: StoryboardAssetGroupPresentation = {
    characterConsistency: '', isAssetGroup: false, propAssets: [], props: [], propsAvailable: false,
    roleAssets: [], roles: [], sceneAssets: [], scenes: [], shots: [], storyStructure: '',
  }
  if (!isAssetGroup) return empty

  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const orderedChildIds = stringList(content.ordered_child_ids)
  const promptByShotId = new Map<string, CanvasNode>()
  for (const node of nodes) {
    const shotId = stringValue(node.contentData?.shot_id)
    if (shotId && node.contentData?.subtype === 'prompt') promptByShotId.set(shotId, node)
  }
  const shots = orderedChildIds.flatMap((id) => {
    const child = nodesById.get(id)
    if (!child) return []
    const shotId = stringValue(child.contentData?.shot_id)
    const prompt = promptByShotId.get(shotId)
    if (!shotId || !prompt) return []
    return [{
      id: child.id,
      promptNodeId: prompt.id,
      shotId,
      title: stringValue(child.contentData?.shot_title) || child.title,
    }]
  })

  const roles: string[] = []
  const scenes: string[] = []
  const props: string[] = []
  const roleAssetByName = new Map<string, StoryboardAssetGroupAsset>()
  const sceneAssetByName = new Map<string, StoryboardAssetGroupAsset>()
  const propAssetByName = new Map<string, StoryboardAssetGroupAsset>()
  function appendAsset(
    target: Map<string, StoryboardAssetGroupAsset>,
    kind: StoryboardAssetKind,
    name: string,
    promptNodeId: string,
    shotId: string,
  ) {
    const existing = target.get(name)
    if (existing) {
      appendUnique(existing.promptNodeIds, [promptNodeId])
      appendUnique(existing.shotIds, [shotId])
      return
    }
    target.set(name, { kind, name, promptNodeIds: [promptNodeId], shotIds: [shotId] })
  }
  let propsAvailable = false
  for (const shot of shots) {
    const prompt = promptByShotId.get(shot.shotId)
    if (!prompt) continue
    const promptRoles = stringList(prompt.contentData?.shot_characters)
    appendUnique(roles, promptRoles)
    for (const role of promptRoles) appendAsset(roleAssetByName, 'role', role, prompt.id, shot.shotId)
    const scene = stringValue(prompt.contentData?.shot_scene)
    if (scene) {
      appendUnique(scenes, [scene])
      appendAsset(sceneAssetByName, 'scene', scene, prompt.id, shot.shotId)
    }
    if (Object.prototype.hasOwnProperty.call(prompt.contentData ?? {}, 'shot_props')) {
      propsAvailable = true
      const promptProps = stringList(prompt.contentData?.shot_props)
      appendUnique(props, promptProps)
      for (const prop of promptProps) appendAsset(propAssetByName, 'prop', prop, prompt.id, shot.shotId)
    }
  }

  return {
    characterConsistency: stringValue(content.character_consistency),
    isAssetGroup: true,
    propAssets: [...propAssetByName.values()],
    props,
    propsAvailable,
    roleAssets: [...roleAssetByName.values()],
    roles,
    sceneAssets: [...sceneAssetByName.values()],
    scenes,
    shots,
    storyStructure: stringValue(content.story_structure),
  }
}
