import { request } from '../../api/request'
import type {
  Template,
  TemplateListResponse,
  TemplateUseResponse,
} from './types'

export function fetchTemplates() {
  return request.get<TemplateListResponse>('/templates')
}

function resolveTemplatePath(templateId: string) {
  const normalizedTemplateId = templateId.trim()
  return normalizedTemplateId
    ? `/templates/${encodeURIComponent(normalizedTemplateId)}`
    : ''
}

export function fetchTemplateDetail(templateId: string) {
  const path = resolveTemplatePath(templateId)
  return path
    ? request.get<Template>(path)
    : Promise.reject(new TypeError('Template ID is required.'))
}

export function deleteTemplate(templateId: string) {
  const path = resolveTemplatePath(templateId)
  return path
    ? request.delete<void>(path)
    : Promise.reject(new TypeError('Template ID is required.'))
}

export function useTemplate(templateId: string) {
  const path = resolveTemplatePath(templateId)
  return path
    ? request.post<TemplateUseResponse>(`${path}/use`)
    : Promise.reject(new TypeError('Template ID is required.'))
}
