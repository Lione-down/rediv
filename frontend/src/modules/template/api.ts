import { request } from '../../api/request'
import type { Template, TemplateListResponse } from './types'

export function fetchTemplates() {
  return request.get<TemplateListResponse>('/templates')
}

export function fetchTemplateDetail(templateId: string) {
  const normalizedTemplateId = templateId.trim()
  if (!normalizedTemplateId) {
    return Promise.reject(new TypeError('Template ID is required.'))
  }

  return request.get<Template>(
    `/templates/${encodeURIComponent(normalizedTemplateId)}`,
  )
}
