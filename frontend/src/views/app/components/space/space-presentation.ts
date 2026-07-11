import type { Asset, AssetType } from '../../../../types/asset'

export type SpaceTab = 'assets' | 'templates' | 'quota'
export type SpaceAssetFilter = 'all' | AssetType
export type SpaceDetailKind = 'asset' | 'template' | null

export interface SpaceAssetFilterOption {
  value: SpaceAssetFilter
  label: string
}

export const SPACE_ASSET_FILTERS: SpaceAssetFilterOption[] = [
  { value: 'all', label: '全部' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
]

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const assetTypeLabels: Record<string, string> = {
  prompt: 'Prompt',
  image: '图片',
  video: '视频',
}

const assetSourceLabels: Record<string, string> = {
  generation: '生成',
  upload: '上传',
}

function getLabel(labels: Record<string, string>, value: string, fallback: string) {
  return Object.prototype.hasOwnProperty.call(labels, value)
    ? labels[value]
    : fallback
}

export function getAssetTypeLabel(type: string) {
  return getLabel(assetTypeLabels, type, '未知类型')
}

export function getAssetSourceLabel(source: string) {
  return getLabel(assetSourceLabels, source, '未知来源')
}

export function getRenderableAssetMediaUrl(asset: Asset) {
  if (
    (asset.type !== 'image' && asset.type !== 'video') ||
    asset.source !== 'generation' ||
    !asset.url?.trim()
  ) {
    return ''
  }

  try {
    const mediaUrl = new URL(asset.url.trim())
    if (
      mediaUrl.protocol !== 'https:' ||
      mediaUrl.username ||
      mediaUrl.password
    ) {
      return ''
    }

    return mediaUrl.href
  } catch {
    return ''
  }
}

export function getAssetTitle(asset: Asset) {
  const content = asset.content_text?.trim()
  if (content) {
    return content
  }

  if (asset.url) {
    try {
      const pathname = new URL(asset.url, 'https://revid.local').pathname
      const filename = pathname.split('/').filter(Boolean).pop()
      if (filename) {
        return decodeURIComponent(filename)
      }
    } catch {
      // Malformed URLs stay private and use the neutral label below.
    }
  }

  return '未命名资产'
}

export function getAssetShortTitle(asset: Asset, maxLength = 72) {
  return shortenSpaceText(getAssetTitle(asset), maxLength)
}

export function shortenSpaceText(value: string, maxLength = 72) {
  const title = value.trim() || '未命名'
  return title.length > maxLength
    ? `${title.slice(0, maxLength).trim()}…`
    : title
}

export function formatSpaceDate(value: string, includeTime = false) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '时间未知'
  }

  return includeTime ? dateTimeFormatter.format(date) : dateFormatter.format(date)
}
