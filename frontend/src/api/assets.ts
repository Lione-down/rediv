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

export function createAsset(payload: AssetCreatePayload) {
  return request.post<Asset>('/assets/upload', payload)
}
