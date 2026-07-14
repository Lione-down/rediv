import { request } from '../../api/request'
import type {
  CanvasTemplateCapturePayload,
  Template,
  TemplateInstantiatePayload,
  TemplateInstantiateResponse,
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

function resolveCanvasTemplatePath(projectId: string, canvasId: string) {
  const normalizedProjectId = projectId.trim()
  const normalizedCanvasId = canvasId.trim()
  if (!normalizedProjectId) throw new TypeError('Project ID is required.')
  if (!normalizedCanvasId) throw new TypeError('Canvas ID is required.')
  return `/api/projects/${encodeURIComponent(normalizedProjectId)}` +
    `/canvases/${encodeURIComponent(normalizedCanvasId)}/templates`
}

export function captureCanvasTemplate(
  projectId: string,
  canvasId: string,
  payload: CanvasTemplateCapturePayload,
) {
  return request.post<Template>(resolveCanvasTemplatePath(projectId, canvasId), payload)
}

export function instantiateCanvasTemplate(
  projectId: string,
  canvasId: string,
  templateId: string,
  payload: TemplateInstantiatePayload,
) {
  const normalizedTemplateId = templateId.trim()
  if (!normalizedTemplateId) {
    return Promise.reject(new TypeError('Template ID is required.'))
  }
  const path = `${resolveCanvasTemplatePath(projectId, canvasId)}` +
    `/${encodeURIComponent(normalizedTemplateId)}/instantiate`
  return request.post<TemplateInstantiateResponse>(path, payload)
}
