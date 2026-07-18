import type { CinematicSkillTransport } from './cinematic-skills'

export interface ProviderCostAcknowledgement {
  user_id: string
  provider_id: string
  acknowledged_until: string | null
  cancelled_at: string | null
  active: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function boundedString(value: unknown, maximum: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maximum
    ? value.trim()
    : null
}

function invalid(): never {
  throw new Error('provider cost acknowledgement contract 无效。')
}

function parse(value: unknown, providerId: string): ProviderCostAcknowledgement {
  if (!isRecord(value) || Object.keys(value).sort().join('|') !== [
    'acknowledged_until', 'active', 'cancelled_at', 'provider_id', 'user_id',
  ].sort().join('|') || !boundedString(value.user_id, 96) || value.provider_id !== providerId ||
    typeof value.active !== 'boolean' ||
    (value.acknowledged_until !== null && !boundedString(value.acknowledged_until, 64)) ||
    (value.cancelled_at !== null && !boundedString(value.cancelled_at, 64))
  ) invalid()
  return value as unknown as ProviderCostAcknowledgement
}

function path(providerId: string) {
  const id = boundedString(providerId, 64)
  if (!id) invalid()
  return `/api/provider-cost-acknowledgements/${encodeURIComponent(id)}`
}

export async function loadProviderCostAcknowledgement(providerId: string, transport: CinematicSkillTransport) {
  const response = await transport.get<unknown>(path(providerId))
  return parse(response.data, providerId)
}

export async function acknowledgeProviderCost(
  providerId: string,
  durationHours: number | undefined,
  transport: CinematicSkillTransport,
) {
  if (durationHours !== undefined && (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > 720)) {
    invalid()
  }
  const response = await transport.post<unknown>(path(providerId), {
    ...(durationHours === undefined ? {} : { duration_hours: durationHours }),
  })
  return parse(response.data, providerId)
}

export async function cancelProviderCostAcknowledgement(providerId: string, transport: CinematicSkillTransport) {
  if (!transport.delete) invalid()
  const response = await transport.delete<unknown>(path(providerId))
  return parse(response.data, providerId)
}
