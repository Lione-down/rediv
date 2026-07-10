import { request } from '../../api/request'
import type { Project, ProjectCreatePayload, ProjectListResponse } from './types'

export function fetchProjects() {
  return request.get<ProjectListResponse>('/projects')
}

export function createProject(payload: ProjectCreatePayload) {
  return request.post<Project>('/projects', payload)
}
