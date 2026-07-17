export type ShotControlId = 'angle' | 'framing' | 'focus' | 'lighting' | 'temporal'
export type ShotControlMediaType = 'image' | 'video'

export interface ShotControls {
  contract_version: 1
  angle: 'eye-level' | 'high-angle' | 'low-angle' | 'overhead'
  framing: 'wide' | 'medium' | 'close-up'
  focus: 'deep' | 'shallow'
  lighting: 'natural' | 'soft' | 'dramatic'
  temporal: 'hold' | 'advance' | 'rewind'
}

export type ShotControlDefaults = Omit<ShotControls, 'contract_version'>

export interface ShotControlCapabilities {
  contract_version: 1
  supported_controls: ShotControlId[]
  provider_controls: ShotControlId[]
  defaults: ShotControlDefaults
}

export interface ShotControlDefinition {
  id: ShotControlId
  title: string
  values: ReadonlyArray<{ value: string; label: string }>
}

export const SHOT_CONTROL_DEFAULT_VALUES: ShotControlDefaults = {
  angle: 'eye-level',
  framing: 'medium',
  focus: 'deep',
  lighting: 'natural',
  temporal: 'hold',
}

export const SHOT_CONTROL_DEFAULTS: ShotControls = {
  contract_version: 1,
  ...SHOT_CONTROL_DEFAULT_VALUES,
}

export const SHOT_CONTROL_DEFINITIONS: Record<ShotControlId, ShotControlDefinition> = {
  angle: {
    id: 'angle', title: '镜头角度',
    values: [
      { value: 'eye-level', label: '平视' }, { value: 'high-angle', label: '俯视' },
      { value: 'low-angle', label: '仰视' }, { value: 'overhead', label: '顶视' },
    ],
  },
  framing: {
    id: 'framing', title: '景别',
    values: [
      { value: 'wide', label: '远景' }, { value: 'medium', label: '中景' }, { value: 'close-up', label: '近景' },
    ],
  },
  focus: {
    id: 'focus', title: '焦点',
    values: [{ value: 'deep', label: '深焦' }, { value: 'shallow', label: '浅焦' }],
  },
  lighting: {
    id: 'lighting', title: '灯光',
    values: [{ value: 'natural', label: '自然' }, { value: 'soft', label: '柔光' }, { value: 'dramatic', label: '戏剧' }],
  },
  temporal: {
    id: 'temporal', title: '时间方向',
    values: [{ value: 'hold', label: '保持' }, { value: 'advance', label: '前推' }, { value: 'rewind', label: '后推' }],
  },
}

const SHOT_CONTROL_IDS = Object.keys(SHOT_CONTROL_DEFINITIONS) as ShotControlId[]
const MEDIA_CONTROL_IDS: Record<ShotControlMediaType, readonly ShotControlId[]> = {
  image: ['angle', 'framing', 'focus', 'lighting'],
  video: SHOT_CONTROL_IDS,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

function isShotControlId(value: unknown): value is ShotControlId {
  return typeof value === 'string' && SHOT_CONTROL_IDS.includes(value as ShotControlId)
}

function hasExactDefaultValues(value: unknown) {
  return isRecord(value) && hasExactKeys(value, SHOT_CONTROL_IDS) && SHOT_CONTROL_IDS.every((control) => (
    value[control] === SHOT_CONTROL_DEFAULTS[control]
  ))
}

export function parseShotControlCapabilities(
  value: unknown,
  mediaType: ShotControlMediaType,
): ShotControlCapabilities {
  if (!isRecord(value) || !hasExactKeys(value, [
    'contract_version', 'supported_controls', 'provider_controls', 'defaults',
  ]) || value.contract_version !== 1 || !hasExactDefaultValues(value.defaults)) {
    throw new Error('镜头控制 capability contract 无效。')
  }
  const supported = value.supported_controls
  const provider = value.provider_controls
  const allowed = MEDIA_CONTROL_IDS[mediaType]
  if (
    !Array.isArray(supported) || supported.some((control) => !isShotControlId(control) || !allowed.includes(control)) ||
    new Set(supported).size !== supported.length ||
    !Array.isArray(provider) || provider.some((control) => !isShotControlId(control) || !allowed.includes(control)) ||
    supported.length !== provider.length || supported.some((control, index) => provider[index] !== control)
  ) throw new Error('镜头控制 capability contract 无效。')
  return {
    contract_version: 1,
    supported_controls: [...supported] as ShotControlId[],
    provider_controls: [...provider] as ShotControlId[],
    defaults: { ...SHOT_CONTROL_DEFAULT_VALUES },
  }
}

export function parseShotControls(
  value: unknown,
  capabilities: ShotControlCapabilities,
  mediaType: ShotControlMediaType,
  referenceMode: string | null,
  imageIds: readonly string[],
): ShotControls {
  if (!isRecord(value) || !hasExactKeys(value, ['contract_version', ...SHOT_CONTROL_IDS]) || value.contract_version !== 1) {
    throw new Error('镜头控制 contract 无效。')
  }
  const parsed: ShotControls = { ...SHOT_CONTROL_DEFAULTS }
  let hasExplicitOverride = false
  for (const control of SHOT_CONTROL_IDS) {
    const selected = value[control]
    const definition = SHOT_CONTROL_DEFINITIONS[control]
    if (typeof selected !== 'string' || !definition.values.some((item) => item.value === selected)) {
      throw new Error('镜头控制 contract 无效。')
    }
    if (selected !== SHOT_CONTROL_DEFAULTS[control]) {
      hasExplicitOverride = true
      if (!capabilities.provider_controls.includes(control)) throw new Error('当前 capability 不支持此镜头控制。')
    }
    parsed[control] = selected as never
  }
  if (!hasExplicitOverride) throw new Error('镜头控制需要至少一个显式调整。')
  if (parsed.temporal !== 'hold' && (
    mediaType !== 'video' || referenceMode !== 'image-to-video' || imageIds.length !== 1
  )) throw new Error('时间前推或后推只支持单参考图的图生视频。')
  return parsed
}

export function createShotControls(
  current: ShotControls | undefined,
  control: ShotControlId,
  value: string,
): ShotControls | undefined {
  const definition = SHOT_CONTROL_DEFINITIONS[control]
  if (!definition.values.some((item) => item.value === value)) throw new Error('镜头控制 contract 无效。')
  const next: ShotControls = { ...(current ?? SHOT_CONTROL_DEFAULTS), [control]: value as never }
  return SHOT_CONTROL_IDS.some((id) => next[id] !== SHOT_CONTROL_DEFAULTS[id]) ? next : undefined
}

export function formatShotControls(value: ShotControls | undefined) {
  if (!value) return []
  return SHOT_CONTROL_IDS
    .filter((control) => value[control] !== SHOT_CONTROL_DEFAULTS[control])
    .map((control) => {
      const definition = SHOT_CONTROL_DEFINITIONS[control]
      const label = definition.values.find((item) => item.value === value[control])?.label ?? value[control]
      return `${definition.title} ${label}`
    })
}
