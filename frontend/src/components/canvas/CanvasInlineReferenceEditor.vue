<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type {
  CanvasCardPromptDocument,
  CanvasCardPromptSegment,
  CanvasCardReference,
} from '../../modules/canvas/canvas-card-view-model'
import {
  canvasCardPromptText,
  createCanvasCardPromptDocument,
} from '../../modules/canvas/canvas-card-configuration'

const props = withDefaults(defineProps<{
  disabled?: boolean
  modelValue: string
  promptDocument: CanvasCardPromptDocument
  references: readonly CanvasCardReference[]
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  change: [prompt: string, promptDocument: CanvasCardPromptDocument]
  mentionState: [isOpen: boolean]
}>()

const editor = ref<HTMLDivElement | null>(null)
let savedRange: Range | null = null

function signature(document: CanvasCardPromptDocument) {
  return JSON.stringify(document.segments)
}

function referenceFor(stableId: string, assetId: string) {
  return props.references.find((reference) => (
    reference.stableId === stableId && reference.assetId === assetId
  ))
}

function createTokenElement(
  stableId: string,
  assetId: string,
  suppliedReference?: CanvasCardReference,
) {
  const reference = suppliedReference ?? referenceFor(stableId, assetId)
  const token = document.createElement('span')
  token.className = 'canvas-inline-reference-editor__token'
  token.contentEditable = 'false'
  token.dataset.structuredReferenceToken = ''
  token.dataset.referenceStableId = stableId
  token.dataset.referenceAssetId = assetId
  token.setAttribute('role', 'img')
  token.setAttribute('aria-label', reference ? `引用 ${reference.displayName}` : '已失效引用')
  if (reference?.thumbnailUrl) {
    const image = document.createElement('img')
    image.src = reference.thumbnailUrl
    image.alt = ''
    token.append(image)
  } else {
    const placeholder = document.createElement('span')
    placeholder.textContent = reference?.displayName.slice(0, 1) || '!'
    placeholder.setAttribute('aria-hidden', 'true')
    token.append(placeholder)
  }
  const name = document.createElement('strong')
  name.textContent = reference?.displayName ?? '已失效引用'
  token.append(name)
  return token
}

function effectiveDocument() {
  if (props.promptDocument.segments.length) return props.promptDocument
  return createCanvasCardPromptDocument(
    props.modelValue ? [{ kind: 'text', text: props.modelValue }] : [],
  )
}

function renderDocument() {
  const root = editor.value
  if (!root) return
  const document = effectiveDocument()
  root.replaceChildren()
  for (const segment of document.segments) {
    root.append(segment.kind === 'text'
      ? window.document.createTextNode(segment.text)
      : createTokenElement(segment.stableId, segment.assetId))
  }
}

function readDocumentFromDom() {
  const root = editor.value
  if (!root) return createCanvasCardPromptDocument([])
  const segments: CanvasCardPromptSegment[] = []
  for (const child of root.childNodes) {
    if (
      child instanceof HTMLElement &&
      child.hasAttribute('data-structured-reference-token')
    ) {
      const stableId = child.dataset.referenceStableId ?? ''
      const assetId = child.dataset.referenceAssetId ?? ''
      segments.push({ kind: 'reference', stableId, assetId })
      continue
    }
    const text = child instanceof HTMLBRElement ? '\n' : child.textContent ?? ''
    if (text) segments.push({ kind: 'text', text })
  }
  return createCanvasCardPromptDocument(segments)
}

function rangeInsideEditor(range: Range | null): range is Range {
  const root = editor.value
  return Boolean(root && range && root.contains(range.commonAncestorContainer))
}

function captureRange() {
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null
  if (rangeInsideEditor(range)) savedRange = range.cloneRange()
}

function textBeforeCaret() {
  const root = editor.value
  const selection = window.getSelection()
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null
  if (!root || !rangeInsideEditor(range)) return ''
  const prefix = range.cloneRange()
  prefix.selectNodeContents(root)
  prefix.setEnd(range.endContainer, range.endOffset)
  return prefix.toString()
}

function commitDom() {
  captureRange()
  const promptDocument = readDocumentFromDom()
  const prompt = canvasCardPromptText(promptDocument)
  emit('change', prompt, promptDocument)
  emit('mentionState', /@\s*$/.test(textBeforeCaret() || prompt))
}

function insertReference(reference: CanvasCardReference) {
  const root = editor.value
  if (!root || props.disabled) return
  const range = rangeInsideEditor(savedRange) ? savedRange : document.createRange()
  if (!rangeInsideEditor(savedRange)) {
    const lastChild = root.lastChild
    if (lastChild?.nodeType === Node.TEXT_NODE) {
      range.setStart(lastChild, lastChild.textContent?.length ?? 0)
      range.collapse(true)
    } else {
      range.selectNodeContents(root)
      range.collapse(false)
    }
  }
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    const textNode = range.startContainer as Text
    const before = textNode.data.slice(0, range.startOffset)
    const trigger = before.match(/@\s*$/)
    if (trigger) range.setStart(textNode, range.startOffset - trigger[0].length)
  }
  range.deleteContents()
  const token = createTokenElement(reference.stableId, reference.assetId, reference)
  const trailingText = document.createTextNode(' ')
  range.insertNode(trailingText)
  range.insertNode(token)
  const nextRange = document.createRange()
  nextRange.setStart(trailingText, trailingText.data.length)
  nextRange.collapse(true)
  root.focus({ preventScroll: true })
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(nextRange)
  savedRange = nextRange.cloneRange()
  commitDom()
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') ?? ''
  document.execCommand('insertText', false, text)
}

watch(
  () => [props.modelValue, signature(props.promptDocument), props.references] as const,
  () => {
    const root = editor.value
    if (root === document.activeElement) return
    renderDocument()
  },
  { deep: true },
)

onMounted(renderDocument)
defineExpose({ focus: () => editor.value?.focus({ preventScroll: true }), insertReference })
</script>

<template>
  <div
    ref="editor"
    class="canvas-inline-reference-editor"
    data-inline-prompt-editor
    role="textbox"
    aria-label="卡片生成提示词"
    aria-multiline="true"
    :aria-disabled="disabled"
    :contenteditable="disabled ? 'false' : 'true'"
    @input="commitDom"
    @keyup="captureRange"
    @mouseup="captureRange"
    @paste="handlePaste"
  ></div>
</template>

<style scoped lang="scss">
.canvas-inline-reference-editor {
  box-sizing: border-box;
  width: 100%;
  min-height: 62px;
  max-height: 126px;
  padding: 10px 11px;
  overflow: auto;
  color: var(--v2-text-primary);
  font: inherit;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  outline: none;
}
.canvas-inline-reference-editor[aria-disabled='true'] { cursor: not-allowed; opacity: .58; }
.canvas-inline-reference-editor:empty::before {
  color: var(--v2-text-muted);
  content: '描述镜头运动、主体动作和氛围，可输入 @ 引用已连接图片';
  pointer-events: none;
}
:deep(.canvas-inline-reference-editor__token) {
  display: inline-flex;
  max-width: 150px;
  height: 26px;
  align-items: center;
  gap: 5px;
  margin: 0 3px;
  padding: 2px 7px 2px 3px;
  border: 1px solid var(--v2-border-standard);
  border-radius: var(--v2-radius-pill);
  color: var(--v2-text-primary);
  background: var(--v2-surface-2);
  vertical-align: middle;
  user-select: all;
}
:deep(.canvas-inline-reference-editor__token img),
:deep(.canvas-inline-reference-editor__token > span) {
  display: grid;
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  place-items: center;
  border-radius: 50%;
  object-fit: cover;
  background: var(--v2-surface-3);
}
:deep(.canvas-inline-reference-editor__token strong) {
  overflow: hidden;
  font-size: 10px;
  font-weight: var(--v2-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
