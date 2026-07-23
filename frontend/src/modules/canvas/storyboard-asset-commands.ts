import type { CanvasNode } from '../../types/canvas'
import { isNodeMutationSupported } from './node-registry'
import {
  resolveStoryboardAssetGroupPresentation,
  type StoryboardAssetKind,
} from './storyboard-asset-group-presentation'

const MAX_ASSET_NAME_LENGTH = 80
const MAX_PROMPT_LENGTH = 4000

interface StoryboardAssetCommandBase {
  type: 'mutate-storyboard-asset'
  groupId: string
  kind: StoryboardAssetKind
}

export type StoryboardAssetCommand = StoryboardAssetCommandBase & (
  | { action: 'add'; promptNodeId: string; value: string }
  | { action: 'remove'; value: string }
  | {
      action: 'edit'
      promptNodeId: string
      value: string
      nextValue: string
      promptText: string
    }
)

export interface StoryboardAssetEditIntent {
  groupId: string
  kind: StoryboardAssetKind
  name: string
  promptNodeId: string
}

export interface StoryboardAssetNodeUpdate {
  nodeId: string
  updates: Partial<Omit<CanvasNode, 'id'>>
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.flatMap((item) => {
    const normalized = stringValue(item)
    return normalized ? [normalized] : []
  }))]
}

function normalizeName(value: string) {
  const normalized = value.trim()
  return normalized && normalized.length <= MAX_ASSET_NAME_LENGTH ? normalized : ''
}

function assetValues(node: CanvasNode, kind: StoryboardAssetKind) {
  if (kind === 'role') return stringList(node.contentData?.shot_characters)
  if (kind === 'prop') return stringList(node.contentData?.shot_props)
  const scene = stringValue(node.contentData?.shot_scene)
  return scene ? [scene] : []
}

function withAssetValues(node: CanvasNode, kind: StoryboardAssetKind, values: string[]) {
  const contentData = JSON.parse(JSON.stringify(node.contentData ?? {})) as Record<string, unknown>
  if (kind === 'role') contentData.shot_characters = values
  else if (kind === 'prop') contentData.shot_props = values
  else contentData.shot_scene = values[0] ?? ''
  return contentData
}

function relatedPromptNodes(nodes: readonly CanvasNode[], groupId: string) {
  const group = nodes.find((node) => node.id === groupId)
  if (!group || group.isLocked || !isNodeMutationSupported(group)) return null
  const presentation = resolveStoryboardAssetGroupPresentation(group, nodes)
  if (!presentation.isAssetGroup) return null
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const prompts = presentation.shots.flatMap((shot) => {
    const prompt = nodeById.get(shot.promptNodeId)
    return prompt ? [prompt] : []
  })
  if (!prompts.length) return null
  return { group, presentation, prompts }
}

function isEditablePrompt(node: CanvasNode) {
  return (
    node.type === 'script' && node.contentData?.subtype === 'prompt' &&
    !node.isLocked && isNodeMutationSupported(node)
  )
}

export function resolveStoryboardAssetCommand(
  nodes: readonly CanvasNode[],
  command: StoryboardAssetCommand,
): StoryboardAssetNodeUpdate[] | null {
  const related = relatedPromptNodes(nodes, command.groupId)
  const value = normalizeName(command.value)
  if (!related || !value) return null

  if (command.action === 'add') {
    const prompt = related.prompts.find((node) => node.id === command.promptNodeId)
    if (!prompt || !isEditablePrompt(prompt)) return null
    const current = assetValues(prompt, command.kind)
    if (command.kind === 'scene') {
      if (current[0] === value) return null
      return [{ nodeId: prompt.id, updates: { contentData: withAssetValues(prompt, command.kind, [value]) } }]
    }
    if (current.includes(value)) return null
    return [{ nodeId: prompt.id, updates: { contentData: withAssetValues(prompt, command.kind, [...current, value]) } }]
  }

  const affected = related.prompts.filter((prompt) => assetValues(prompt, command.kind).includes(value))
  if (!affected.length || affected.some((prompt) => !isEditablePrompt(prompt))) return null

  if (command.action === 'remove') {
    return affected.map((prompt) => ({
      nodeId: prompt.id,
      updates: {
        contentData: withAssetValues(
          prompt,
          command.kind,
          assetValues(prompt, command.kind).filter((candidate) => candidate !== value),
        ),
      },
    }))
  }

  const nextValue = normalizeName(command.nextValue)
  const prompt = related.prompts.find((candidate) => candidate.id === command.promptNodeId)
  if (
    !nextValue || command.promptText.length > MAX_PROMPT_LENGTH ||
    !prompt || !affected.includes(prompt) || !isEditablePrompt(prompt)
  ) return null
  const updates = affected.map((candidate): StoryboardAssetNodeUpdate => {
    const renamed = assetValues(candidate, command.kind).map((name) => name === value ? nextValue : name)
    const unique = [...new Set(renamed)]
    const contentData = withAssetValues(candidate, command.kind, unique)
    if (candidate.id !== prompt.id) return { nodeId: candidate.id, updates: { contentData } }
    return {
      nodeId: candidate.id,
      updates: {
        content: command.promptText,
        contentData: { ...contentData, text: command.promptText },
      },
    }
  })
  const hasChange = updates.some(({ nodeId, updates: next }) => {
    const current = nodes.find((candidate) => candidate.id === nodeId)
    return JSON.stringify(current?.contentData) !== JSON.stringify(next.contentData) ||
      (Object.prototype.hasOwnProperty.call(next, 'content') && current?.content !== next.content)
  })
  return hasChange ? updates : null
}

function validatedCommand<T extends StoryboardAssetCommand>(nodes: readonly CanvasNode[], command: T): T | null {
  return resolveStoryboardAssetCommand(nodes, command) ? command : null
}

export function createAddStoryboardAssetCommand(
  nodes: readonly CanvasNode[],
  groupId: string,
  promptNodeId: string,
  kind: StoryboardAssetKind,
  value: string,
) {
  return validatedCommand(nodes, { type: 'mutate-storyboard-asset', action: 'add', groupId, promptNodeId, kind, value: value.trim() })
}

export function createRemoveStoryboardAssetCommand(
  nodes: readonly CanvasNode[],
  groupId: string,
  kind: StoryboardAssetKind,
  value: string,
) {
  return validatedCommand(nodes, { type: 'mutate-storyboard-asset', action: 'remove', groupId, kind, value: value.trim() })
}

export function createEditStoryboardAssetCommand(
  nodes: readonly CanvasNode[],
  groupId: string,
  promptNodeId: string,
  kind: StoryboardAssetKind,
  value: string,
  nextValue: string,
  promptText: string,
) {
  return validatedCommand(nodes, {
    type: 'mutate-storyboard-asset', action: 'edit', groupId, promptNodeId, kind,
    value: value.trim(), nextValue: nextValue.trim(), promptText,
  })
}
