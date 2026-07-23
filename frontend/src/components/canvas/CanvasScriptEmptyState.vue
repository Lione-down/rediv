<script setup lang="ts">
import { FileInput, FileText, RotateCcw, UserRound } from 'lucide-vue-next'
import { nextTick, ref } from 'vue'

defineProps<{
  canSelectRoleSource: boolean
  canSelectScriptSource: boolean
  roleReferenceCandidates: readonly { id: string; previewUrl?: string; title: string }[]
  roleReferenceCount: number
}>()
const emit = defineEmits<{
  clearRoleReferences: []
  directWrite: [opener: HTMLElement]
  selectRoleReference: [sourceNodeId: string]
  selectScriptSource: []
}>()
const rolePickerOpen = ref(false)
const rolePickerPlacement = ref<'left' | 'right'>('right')
const roleSourceButton = ref<HTMLButtonElement | null>(null)

const ROLE_PICKER_WIDTH_PX = 224
const ROLE_PICKER_GAP_PX = 12
const ROLE_PICKER_SAFE_INSET_PX = 16

function directWrite(event: MouseEvent) {
  emit('directWrite', event.currentTarget as HTMLElement)
}

function restoreRoleSourceFocus() {
  void nextTick(() => roleSourceButton.value?.focus({ preventScroll: true }))
}

function closeRolePicker() {
  if (!rolePickerOpen.value) return
  rolePickerOpen.value = false
  restoreRoleSourceFocus()
}

function toggleRolePicker(event: MouseEvent) {
  if (rolePickerOpen.value) {
    closeRolePicker()
    return
  }
  const host = (event.currentTarget as HTMLElement).closest('.script-empty-state')
  const bounds = host?.getBoundingClientRect()
  const fitsRight = Boolean(bounds && bounds.right + ROLE_PICKER_GAP_PX + ROLE_PICKER_WIDTH_PX <= window.innerWidth - ROLE_PICKER_SAFE_INSET_PX)
  const fitsLeft = Boolean(bounds && bounds.left - ROLE_PICKER_GAP_PX - ROLE_PICKER_WIDTH_PX >= ROLE_PICKER_SAFE_INSET_PX)
  rolePickerPlacement.value = fitsRight || !fitsLeft ? 'right' : 'left'
  rolePickerOpen.value = true
}

function selectRoleReference(sourceNodeId: string) {
  rolePickerOpen.value = false
  emit('selectRoleReference', sourceNodeId)
}
</script>

<template>
  <section class="script-empty-state" aria-label="分镜脚本创作方式" @pointerdown.stop @click.stop @keydown.esc.stop.prevent="closeRolePicker">
    <FileText class="script-empty-state__mark" :size="42" aria-hidden="true" />
    <span>尝试：</span>
    <button type="button" :disabled="!canSelectScriptSource" @click="emit('selectScriptSource')">
      <FileInput :size="16" aria-hidden="true" />
      <strong>剧本生成分镜脚本</strong>
    </button>
    <button ref="roleSourceButton" type="button" :disabled="!canSelectRoleSource" :aria-expanded="rolePickerOpen" @click="toggleRolePicker">
      <UserRound :size="16" aria-hidden="true" />
      <strong>角色生成分镜脚本<template v-if="roleReferenceCount"> · {{ roleReferenceCount }}/8</template></strong>
    </button>
    <div v-if="rolePickerOpen" class="script-empty-state__role-picker" :class="`is-${rolePickerPlacement}`" aria-label="可用角色参考图片">
      <strong class="script-empty-state__role-picker-title">选择角色参考</strong>
      <button
        v-for="candidate in roleReferenceCandidates"
        :key="candidate.id"
        type="button"
        :aria-label="`选择 ${candidate.title} 作为角色参考`"
        @click="selectRoleReference(candidate.id)"
      >
        <img v-if="candidate.previewUrl" :src="candidate.previewUrl" alt="" />
        <UserRound v-else :size="18" aria-hidden="true" />
        <span>{{ candidate.title }}</span>
      </button>
      <span v-if="!roleReferenceCandidates.length" role="status">Canvas 中暂无可用角色图片</span>
    </div>
    <button v-if="roleReferenceCount" type="button" class="script-empty-state__clear" @click="emit('clearRoleReferences')">
      <RotateCcw :size="14" aria-hidden="true" />
      <span>清除角色参考</span>
    </button>
    <button type="button" @click="directWrite">
      <FileText :size="16" aria-hidden="true" />
      <strong>自己编写分镜脚本</strong>
    </button>
  </section>
</template>

<style scoped>
.script-empty-state { position: relative; display: grid; box-sizing: border-box; width: 100%; height: 100%; align-content: center; gap: 8px; padding: 18px 24px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); color: var(--v2-text-secondary); background: var(--v2-surface-2); pointer-events: auto; }
.script-empty-state__mark { justify-self: center; margin-bottom: 6px; color: var(--v2-text-muted); opacity: .48; }
.script-empty-state > span { color: var(--v2-text-muted); font-size: 11px; }
.script-empty-state button { display: flex; min-height: 30px; align-items: center; gap: 9px; padding: 4px 6px; border: 0; border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: transparent; font: inherit; text-align: left; cursor: pointer; }
.script-empty-state button:hover { color: var(--v2-text-primary); background: var(--v2-surface-3); }
.script-empty-state button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
.script-empty-state button:disabled { cursor: not-allowed; opacity: .38; }
.script-empty-state strong { font-size: 12px; font-weight: var(--v2-font-weight-medium); }
.script-empty-state .script-empty-state__clear { min-height: 24px; color: var(--v2-text-muted); font-size: 11px; }
.script-empty-state__role-picker { position: absolute; z-index: 12; top: 50%; left: calc(100% + 12px); display: grid; box-sizing: border-box; width: 224px; max-height: 180px; gap: 6px; overflow: auto; padding: 9px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-md); background: var(--v2-surface-1); box-shadow: var(--v2-shadow-floating); transform: translateY(-50%); }
.script-empty-state__role-picker.is-left { right: calc(100% + 12px); left: auto; }
.script-empty-state .script-empty-state__role-picker-title { padding: 2px 4px 4px; color: var(--v2-text-primary); font-size: 11px; }
.script-empty-state__role-picker button { min-height: 48px; padding: 4px; background: var(--v2-surface-2); }
.script-empty-state__role-picker img { width: 40px; height: 40px; flex: 0 0 40px; border-radius: var(--v2-radius-sm); object-fit: cover; }
.script-empty-state__role-picker > span { padding: 5px 6px; color: var(--v2-text-muted); font-size: 11px; }
</style>
