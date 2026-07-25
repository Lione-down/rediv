import type { CanvasNode } from '../../types/canvas'
import type { VideoReferenceBinding } from './generation-capability-contract'
import type {
  CanvasCardConfiguration,
  CanvasCardPromptDocument,
  CanvasCardPromptSegment,
  CanvasCardReference,
} from './canvas-card-view-model'

export interface CanvasCardConfigurationSnapshot extends CanvasCardConfiguration {
  schemaVersion: 1
  references: readonly CanvasCardReference[]
}

export interface PersistedCanvasCardConfiguration {
  schema_version: 1
  generation_mode: string | null
  model_id: string | null
  prompt_document: {
    schema_version: 1
    segments: Array<
      | { kind: 'text'; text: string }
      | { kind: 'reference'; stable_id: string; asset_id: string }
    >
  }
  references: Array<{
    stable_id: string
    asset_id: string
    display_name: string
    thumbnail_url: string
    source_revision: number
    role: string
    order: number
  }>
}

export function serializeCanvasCardConfiguration(
  configuration: CanvasCardConfigurationSnapshot,
): PersistedCanvasCardConfiguration {
  return {
    schema_version: 1,
    generation_mode: configuration.generationMode,
    model_id: configuration.modelId,
    prompt_document: {
      schema_version: 1,
      segments: configuration.promptDocument.segments.map((segment) => (
        segment.kind === 'text'
          ? { kind: 'text' as const, text: segment.text }
          : {
              kind: 'reference' as const,
              stable_id: segment.stableId,
              asset_id: segment.assetId,
            }
      )),
    },
    references: [...configuration.references]
      .sort((left, right) => left.order - right.order)
      .map((reference) => ({
        stable_id: reference.stableId,
        asset_id: reference.assetId,
        display_name: reference.displayName,
        thumbnail_url: reference.thumbnailUrl,
        source_revision: reference.sourceRevision,
        role: reference.role,
        order: reference.order,
      })),
  }
}

export function createCanvasCardPromptDocument(
  segments: readonly CanvasCardPromptSegment[],
): CanvasCardPromptDocument {
  const normalized: CanvasCardPromptSegment[] = []
  for (const segment of segments) {
    if (segment.kind === 'text') {
      if (!segment.text) continue
      const previous = normalized.at(-1)
      if (previous?.kind === 'text') previous.text += segment.text
      else normalized.push({ kind: 'text', text: segment.text })
      continue
    }
    if (!segment.stableId.trim() || !segment.assetId.trim()) continue
    normalized.push({
      kind: 'reference',
      stableId: segment.stableId.trim(),
      assetId: segment.assetId.trim(),
    })
  }
  return { schemaVersion: 1, segments: normalized }
}

export function canvasCardPromptText(document: CanvasCardPromptDocument) {
  return document.segments
    .filter((segment): segment is Extract<CanvasCardPromptSegment, { kind: 'text' }> => segment.kind === 'text')
    .map((segment) => segment.text)
    .join('')
}

export function applyCanvasCardConfiguration(
  node: CanvasNode,
  configuration: CanvasCardConfigurationSnapshot,
): CanvasNode {
  return {
    ...node,
    contentData: {
      ...node.contentData,
      card_configuration: serializeCanvasCardConfiguration(configuration),
    },
  }
}

export function reorderCanvasCardReferences(
  configuration: CanvasCardConfigurationSnapshot,
  stableId: string,
  direction: -1 | 1,
): CanvasCardConfigurationSnapshot {
  const references = [...configuration.references].sort((left, right) => left.order - right.order)
  const currentIndex = references.findIndex((reference) => reference.stableId === stableId)
  const targetIndex = currentIndex + direction
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= references.length) return configuration
  const [reference] = references.splice(currentIndex, 1)
  references.splice(targetIndex, 0, reference)
  return {
    ...configuration,
    references: references.map((item, order) => ({ ...item, order })),
  }
}

export function applyCanvasCardVideoReferenceBindings(
  configuration: CanvasCardConfigurationSnapshot,
  bindings: readonly VideoReferenceBinding[],
): CanvasCardConfigurationSnapshot {
  const referencesByIdentity = new Map(
    configuration.references.map((reference) => [
      `${reference.stableId}:${reference.assetId}`,
      reference,
    ]),
  )
  const references = [...bindings]
    .sort((left, right) => left.order - right.order)
    .map((binding, order) => {
      const reference = referencesByIdentity.get(`${binding.node_id}:${binding.asset_id}`)
      if (!reference) {
        throw new Error('Video reference binding does not belong to the canonical card configuration.')
      }
      return { ...reference, role: binding.role, order }
    })
  const retainedIdentities = new Set(
    references.map((reference) => `${reference.stableId}:${reference.assetId}`),
  )
  const promptDocument = createCanvasCardPromptDocument(
    configuration.promptDocument.segments.flatMap((segment) => (
      segment.kind === 'reference' &&
      !retainedIdentities.has(`${segment.stableId}:${segment.assetId}`)
        ? []
        : [segment]
    )),
  )
  return { ...configuration, promptDocument, references }
}

export function removeCanvasCardReference(
  configuration: CanvasCardConfigurationSnapshot,
  stableId: string,
): CanvasCardConfigurationSnapshot {
  const references = configuration.references
    .filter((reference) => reference.stableId !== stableId)
    .sort((left, right) => left.order - right.order)
    .map((reference, order) => ({ ...reference, order }))
  const retainedIdentities = new Set(
    references.map((reference) => `${reference.stableId}:${reference.assetId}`),
  )
  const promptDocument = createCanvasCardPromptDocument(
    configuration.promptDocument.segments.flatMap((segment) => (
      segment.kind === 'reference' &&
      !retainedIdentities.has(`${segment.stableId}:${segment.assetId}`)
        ? []
        : [segment]
    )),
  )
  return { ...configuration, promptDocument, references }
}
