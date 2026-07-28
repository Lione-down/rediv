import { request } from '../../api/request'
import type {
  CanvasTemplateCapturePayload,
  Template,
  TemplateInstantiatePayload,
  TemplateInstantiateResponse,
  TemplateListResponse,
  TemplateUseResponse,
  WorkflowTemplateInstantiateRequest,
  WorkflowTemplateInstantiateResponse,
  WorkflowTemplateLifecycleListResponse,
  WorkflowTemplatePreflightRequest,
  WorkflowTemplatePreflightResponse,
  WorkflowRun,
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

export function fetchWorkflowTemplates() {
  return request.get<WorkflowTemplateLifecycleListResponse>('/api/workflow-templates')
}

function resolveWorkflowTemplateVersionPath(templateId: string, version: number) {
  const normalizedTemplateId = templateId.trim()
  if (!normalizedTemplateId) throw new TypeError('Workflow template ID is required.')
  if (!Number.isInteger(version) || version < 1) {
    throw new TypeError('Workflow template version must be a positive integer.')
  }
  return `/api/workflow-templates/${encodeURIComponent(normalizedTemplateId)}` +
    `/versions/${version}`
}

export function preflightWorkflowTemplate(
  templateId: string,
  version: number,
  payload: WorkflowTemplatePreflightRequest,
) {
  return request.post<WorkflowTemplatePreflightResponse>(
    `${resolveWorkflowTemplateVersionPath(templateId, version)}/preflight`,
    payload,
  )
}

export function instantiateWorkflowTemplate(
  projectId: string,
  canvasId: string,
  payload: WorkflowTemplateInstantiateRequest,
) {
  const normalizedProjectId = projectId.trim()
  const normalizedCanvasId = canvasId.trim()
  if (!normalizedProjectId) throw new TypeError('Project ID is required.')
  if (!normalizedCanvasId) throw new TypeError('Canvas ID is required.')
  const path = `/api/projects/${encodeURIComponent(normalizedProjectId)}` +
    `/canvases/${encodeURIComponent(normalizedCanvasId)}/workflow-template-instances`
  return request.post<WorkflowTemplateInstantiateResponse>(path, payload)
}

function resolveWorkflowRunPath(projectId: string, canvasId: string, instanceId: string) {
  const values = [projectId, canvasId, instanceId].map((value) => value.trim())
  if (values.some((value) => !value)) {
    throw new TypeError('Workflow run scope is required.')
  }
  return `/api/projects/${encodeURIComponent(values[0])}` +
    `/canvases/${encodeURIComponent(values[1])}` +
    `/workflow-template-instances/${encodeURIComponent(values[2])}/runs`
}

export function preflightWorkflowRun(
  projectId: string,
  canvasId: string,
  instanceId: string,
  costConfirmed: boolean,
) {
  return request.post<WorkflowTemplatePreflightResponse>(
    `${resolveWorkflowRunPath(projectId, canvasId, instanceId)}/preflight`,
    { cost_confirmed: costConfirmed },
  )
}

export function startWorkflowRun(
  projectId: string,
  canvasId: string,
  instanceId: string,
  payload: {
    client_run_id: string
    preflight_fingerprint: string
    cost_confirmed: boolean
  },
) {
  return request.post<WorkflowRun>(
    resolveWorkflowRunPath(projectId, canvasId, instanceId),
    payload,
  )
}

export function fetchLatestWorkflowRun(
  projectId: string,
  canvasId: string,
  instanceId: string,
) {
  return request.get<WorkflowRun>(
    `${resolveWorkflowRunPath(projectId, canvasId, instanceId)}/latest`,
  )
}

export function fetchWorkflowRun(
  projectId: string,
  canvasId: string,
  instanceId: string,
  runId: string,
) {
  return request.get<WorkflowRun>(
    `${resolveWorkflowRunPath(projectId, canvasId, instanceId)}` +
    `/${encodeURIComponent(runId)}`,
  )
}

export function cancelWorkflowRun(
  projectId: string,
  canvasId: string,
  instanceId: string,
  runId: string,
) {
  return request.post<WorkflowRun>(
    `${resolveWorkflowRunPath(projectId, canvasId, instanceId)}` +
    `/${encodeURIComponent(runId)}/cancel`,
  )
}
