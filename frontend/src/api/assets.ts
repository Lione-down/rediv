import { request } from './request'
import type { Asset } from '../types/asset'

export function fetchAssets(assetType?: Asset['type']) {
  return request.get<{ items: Asset[] }>('/assets', {
    params: assetType ? { asset_type: assetType } : undefined,
  })
}

export function createAsset(payload: Pick<Asset, 'type' | 'url' | 'content_text'>) {
  return request.post<Asset>('/assets/upload', payload)
}
