import type { Project } from '../types/project.types.ts'
import type { ProfileImageSummary } from '../types/profile-image.types.ts'
import type { ResumeSummary } from '../types/resume.types.ts'

type ProjectPayload = {
  title: string
  description: string
  href: string
  tags: string[]
  sortOrder: number
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function getApiUrl(path: string) {
  return `${apiBaseUrl}${path}`
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }
    return payload.message || `Request failed with status ${response.status}.`
  } catch {
    return `Request failed with status ${response.status}.`
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), init)

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as T
}

export async function login(username: string, password: string): Promise<string> {
  const data = await requestJson<{ token: string }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  return data.token
}

export async function fetchDefaultLanguage(): Promise<string> {
  const data = await requestJson<{ language: string }>('/api/settings/language')
  return data.language
}

export async function updateDefaultLanguage(language: string): Promise<string> {
  const data = await requestJson<{ language: string }>('/api/settings/language', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ language }),
  })
  return data.language
}

export async function fetchProjects() {
  return requestJson<Project[]>('/api/projects')
}

export async function fetchResume() {
  const response = await fetch(getApiUrl('/api/resume'))

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as ResumeSummary
}

export async function fetchProfileImage() {
  const response = await fetch(getApiUrl('/api/profile-image'))

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as ProfileImageSummary
}

export async function createProject(payload: ProjectPayload) {
  return requestJson<Project>('/api/admin/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })
}

export async function updateProject(projectId: string, payload: ProjectPayload) {
  return requestJson<Project>(`/api/admin/projects/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })
}

export async function deleteProject(projectId: string) {
  const response = await fetch(getApiUrl(`/api/admin/projects/${projectId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
}

export async function uploadResume(file: File) {
  const formData = new FormData()
  formData.append('resume', file)

  return requestJson<ResumeSummary>('/api/admin/resume', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  })
}

export async function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.append('profileImage', file)

  return requestJson<ProfileImageSummary>('/api/admin/profile-image', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  })
}

export function toAbsoluteApiUrl(path: string) {
  if (/^https?:\/\//.test(path) || !path.startsWith('/')) {
    return path
  }

  return apiBaseUrl ? `${apiBaseUrl}${path}` : path
}
