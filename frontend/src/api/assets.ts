import { request } from './request'
import type {
  Asset,
  AssetCreatePayload,
  AssetListParams,
  AssetListResponse,
} from '../types/asset'

export function fetchAssets(params: AssetListParams = {}) {
  return request.get<AssetListResponse>('/assets', {
    params,
  })
}

function resolveAssetPath(assetId: string) {
  const normalizedAssetId = assetId.trim()
  return normalizedAssetId
    ? `/assets/${encodeURIComponent(normalizedAssetId)}`
    : ''
}

export function fetchAssetDetail(assetId: string) {
  const path = resolveAssetPath(assetId)
  return path
    ? request.get<Asset>(path)
    : Promise.reject(new TypeError('Asset ID is required.'))
}

export function deleteAsset(assetId: string) {
  const path = resolveAssetPath(assetId)
  return path
    ? request.delete<Asset>(path)
    : Promise.reject(new TypeError('Asset ID is required.'))
}

export function createAsset(payload: AssetCreatePayload) {
  return request.post<Asset>('/assets/upload', payload)
}
