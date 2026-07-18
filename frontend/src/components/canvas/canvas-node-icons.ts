import {
  AudioLines,
  CircleHelp,
  FileText,
  Group,
  Image,
  Play,
  Sparkles,
  StickyNote,
} from 'lucide-vue-next'

const canvasNodeIcons = {
  'audio-lines': AudioLines,
  'file-text': FileText,
  'sticky-note': StickyNote,
  image: Image,
  sparkles: Sparkles,
  'play-square': Play,
  group: Group,
} as const

export function hasCanvasNodeIcon(icon: string) {
  return icon in canvasNodeIcons
}

export function resolveCanvasNodeIcon(icon: string) {
  return canvasNodeIcons[icon as keyof typeof canvasNodeIcons] ?? CircleHelp
}
