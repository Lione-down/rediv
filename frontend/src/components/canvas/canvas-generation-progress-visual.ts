import { Rect, Text } from 'leafer-ui'
import type {
  CanvasAuthoringCardPresentation,
  CanvasAuthoringCardTone,
} from './canvas-authoring-card-presentation'

type CssVar = (name: string, fallback: string) => string

export interface CanvasGenerationProgressVisuals {
  progressFill?: Rect
  progressRail?: Rect
  progressText?: Text
  statusText?: Text
}

function lifecycleColor(tone: CanvasAuthoringCardTone, cssVar: CssVar) {
  if (tone === 'danger') return cssVar('--danger', 'oklch(66% 0.19 24)')
  if (tone === 'success') return cssVar('--success', 'oklch(72% 0.14 145)')
  return cssVar('--warning', 'oklch(70% 0.13 78)')
}

function fillGeometry(card: CanvasAuthoringCardPresentation) {
  const slot = card.slots.progress!
  const lifecycle = card.lifecycle!
  if (lifecycle.progressPercent !== null) {
    return { x: slot.x, width: slot.width * lifecycle.progressPercent / 100 }
  }
  if (lifecycle.isIndeterminate) {
    const width = Math.max(36, slot.width * 0.24)
    return { x: slot.x + Math.min(28, (slot.width - width) * 0.12), width }
  }
  return { x: slot.x, width: 0 }
}

function percentLabel(value: number | null) {
  return value === null
    ? ''
    : `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(value)}%`
}

export function createCanvasGenerationProgressVisuals(
  card: CanvasAuthoringCardPresentation,
  width: number,
  cssVar: CssVar,
): Required<CanvasGenerationProgressVisuals> {
  const lifecycle = card.lifecycle!
  const color = lifecycleColor(lifecycle.tone, cssVar)
  const geometry = fillGeometry(card)
  return {
    statusText: new Text({
      x: 16,
      y: card.slots.status!.y + 8,
      width: lifecycle.progressPercent === null ? width - 32 : width - 88,
      text: lifecycle.label,
      fill: color,
      fontSize: 11,
      fontWeight: '600',
    }),
    progressText: new Text({
      x: width - 58,
      y: card.slots.status!.y + 8,
      width: 42,
      text: percentLabel(lifecycle.progressPercent),
      fill: color,
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'right',
    }),
    progressRail: new Rect({
      ...card.slots.progress!,
      fill: cssVar('--canvas-progress-rail', 'rgba(240, 238, 246, 0.10)'),
    }),
    progressFill: new Rect({
      x: geometry.x,
      y: card.slots.progress!.y,
      width: geometry.width,
      height: card.slots.progress!.height,
      fill: color,
    }),
  }
}

export function updateCanvasGenerationProgressVisuals(
  visuals: CanvasGenerationProgressVisuals,
  card: CanvasAuthoringCardPresentation,
  width: number,
  cssVar: CssVar,
) {
  const lifecycle = card.lifecycle!
  const color = lifecycleColor(lifecycle.tone, cssVar)
  const geometry = fillGeometry(card)
  if (visuals.statusText) {
    visuals.statusText.y = card.slots.status!.y + 8
    visuals.statusText.width = lifecycle.progressPercent === null ? width - 32 : width - 88
    visuals.statusText.text = lifecycle.label
    visuals.statusText.fill = color
  }
  if (visuals.progressText) {
    visuals.progressText.x = width - 58
    visuals.progressText.y = card.slots.status!.y + 8
    visuals.progressText.text = percentLabel(lifecycle.progressPercent)
    visuals.progressText.fill = color
  }
  if (visuals.progressRail) {
    visuals.progressRail.y = card.slots.progress!.y
    visuals.progressRail.width = width
  }
  if (visuals.progressFill) {
    visuals.progressFill.x = geometry.x
    visuals.progressFill.y = card.slots.progress!.y
    visuals.progressFill.width = geometry.width
    visuals.progressFill.fill = color
  }
}

export function generationProgressVisualTargets(visuals: CanvasGenerationProgressVisuals) {
  return [visuals.statusText, visuals.progressText, visuals.progressRail, visuals.progressFill]
    .filter(Boolean) as Array<Text | Rect>
}
