<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

interface KeyframePreview {
  imageUrl: string
  timeSeconds: number
}

const props = withDefaults(defineProps<{ currentTime: number; placement?: 'above' | 'below'; src: string }>(), { placement: 'below' })
const emit = defineEmits<{ seek: [timeSeconds: number] }>()
const frames = ref<KeyframePreview[]>([])
const state = ref<'loading' | 'ready' | 'error'>('loading')
let samplingRun = 0
let activeSampler: HTMLVideoElement | null = null

const activeIndex = computed(() => {
  if (!frames.value.length) return -1
  return frames.value.reduce((closest, frame, index) => (
    Math.abs(frame.timeSeconds - props.currentTime) < Math.abs(frames.value[closest].timeSeconds - props.currentTime) ? index : closest
  ), 0)
})

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  const tenths = Math.floor((seconds % 1) * 10)
  return `${minutes}:${String(remainder).padStart(2, '0')}.${tenths}`
}

function waitForMedia(video: HTMLVideoElement, eventName: 'loadeddata' | 'loadedmetadata' | 'seeked') {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener(eventName, resolveEvent)
      video.removeEventListener('error', rejectEvent)
    }
    const resolveEvent = () => { cleanup(); resolve() }
    const rejectEvent = () => { cleanup(); reject(new Error('视频关键帧不可用')) }
    video.addEventListener(eventName, resolveEvent, { once: true })
    video.addEventListener('error', rejectEvent, { once: true })
  })
}

async function seekSampler(video: HTMLVideoElement, timeSeconds: number) {
  if (Math.abs(video.currentTime - timeSeconds) < 0.001 && video.readyState >= 2) return
  const settled = waitForMedia(video, 'seeked')
  video.currentTime = timeSeconds
  await settled
}

async function sampleFrames(src: string) {
  cancelSampling()
  const run = ++samplingRun
  frames.value = []
  state.value = 'loading'
  const video = document.createElement('video')
  activeSampler = video
  video.crossOrigin = 'anonymous'
  video.muted = true
  video.preload = 'auto'
  try {
    const metadata = waitForMedia(video, 'loadedmetadata')
    video.src = src
    video.load()
    await metadata
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) throw new Error('视频关键帧不可用')
    if (video.readyState < 2) await waitForMedia(video, 'loadeddata')
    const finalTime = Math.max(0, video.duration - Math.min(0.04, video.duration / 10))
    const times = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Number((finalTime * ratio).toFixed(3)))
    const canvas = document.createElement('canvas')
    canvas.width = 160
    canvas.height = 90
    const context = canvas.getContext('2d')
    if (!context) throw new Error('视频关键帧不可用')
    const previews: KeyframePreview[] = []
    for (const timeSeconds of times) {
      if (run !== samplingRun) return
      await seekSampler(video, timeSeconds)
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      previews.push({ imageUrl: canvas.toDataURL('image/jpeg', 0.74), timeSeconds })
    }
    if (run !== samplingRun) return
    frames.value = previews
    state.value = 'ready'
  } catch {
    if (run === samplingRun) state.value = 'error'
  } finally {
    if (activeSampler === video) activeSampler = null
    if (video.src) {
      video.removeAttribute('src')
      video.load()
    }
  }
}

function cancelSampling() {
  samplingRun += 1
  if (!activeSampler) return
  activeSampler.removeAttribute('src')
  activeSampler.load()
  activeSampler = null
}

watch(() => props.src, (src) => { void sampleFrames(src) }, { immediate: true })
onBeforeUnmount(cancelSampling)
</script>

<template>
  <section class="video-keyframe-rail" :class="{ 'is-above': placement === 'above' }" aria-label="视频关键帧">
    <header>
      <strong>关键帧</strong>
      <span v-if="state === 'ready'">5 帧</span>
      <span v-else-if="state === 'loading'" role="status">正在解析</span>
      <span v-else role="alert">无法预览</span>
    </header>
    <div v-if="state === 'ready'" class="video-keyframe-rail__frames">
      <button
        v-for="(frame, index) in frames"
        :key="`${frame.timeSeconds}-${index}`"
        type="button"
        :aria-current="index === activeIndex ? 'true' : undefined"
        :aria-label="`定位到视频 ${frame.timeSeconds.toFixed(3)} 秒`"
        :data-time="frame.timeSeconds"
        @click.stop="emit('seek', frame.timeSeconds)"
        @pointerdown.stop
      >
        <img :src="frame.imageUrl" alt="" draggable="false" />
        <span>{{ formatTime(frame.timeSeconds) }}</span>
      </button>
    </div>
    <div v-else class="video-keyframe-rail__placeholder" aria-hidden="true"><i v-for="index in 5" :key="index"></i></div>
  </section>
</template>

<style scoped lang="scss">
.video-keyframe-rail { position: absolute; z-index: 4; top: calc(100% + 8px); left: 14px; display: grid; box-sizing: border-box; width: calc(100% - 14px); grid-template-columns: 38px minmax(0, 1fr); align-items: center; gap: 5px; padding: 5px; border: 1px solid var(--v2-border-standard); border-radius: var(--v2-radius-sm); color: var(--v2-text-secondary); background: color-mix(in oklch, var(--v2-surface-2) 94%, transparent); box-shadow: 0 12px 28px oklch(3% 0.01 292 / 0.32); backdrop-filter: blur(10px); pointer-events: auto; }
.video-keyframe-rail.is-above { top: auto; bottom: calc(100% + 8px); }
header { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 3px; font-size: 9px; line-height: 1; }
header strong { color: var(--v2-text-primary); font-weight: 600; white-space: nowrap; }
.video-keyframe-rail__frames, .video-keyframe-rail__placeholder { display: grid; min-width: 0; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 3px; }
button { position: relative; display: block; min-width: 0; aspect-ratio: 16 / 9; padding: 0; overflow: hidden; border: 1px solid transparent; border-radius: 3px; background: var(--v2-surface-1); cursor: pointer; }
button::after { position: absolute; inset: 0; border: 1px solid transparent; border-radius: inherit; content: ''; pointer-events: none; }
button[aria-current='true']::after { border-color: var(--accent-select); box-shadow: inset 0 -2px 0 var(--accent-select); }
button:focus-visible { outline: 2px solid var(--v2-focus-ring); outline-offset: 2px; }
button img { display: block; width: 100%; height: 100%; object-fit: cover; }
button span { position: absolute; right: 2px; bottom: 2px; padding: 1px 3px; border-radius: 2px; color: white; background: oklch(8% 0.01 292 / 0.72); font-size: 8px; line-height: 1.2; }
.video-keyframe-rail__placeholder i { aspect-ratio: 16 / 9; border-radius: 3px; background: var(--v2-surface-3); animation: keyframe-pulse 1.2s ease-in-out infinite alternate; }
.video-keyframe-rail__placeholder i:nth-child(2), .video-keyframe-rail__placeholder i:nth-child(4) { animation-delay: 120ms; }
@media (hover: hover) { button:hover::after { border-color: color-mix(in oklch, var(--accent-select) 55%, transparent); } }
@media (prefers-reduced-motion: reduce) { .video-keyframe-rail__placeholder i { animation: none; } }
@keyframes keyframe-pulse { to { opacity: 0.5; } }
</style>
