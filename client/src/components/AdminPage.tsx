import { useEffect, useMemo, useReducer, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createProject,
  deleteProject,
  fetchDefaultLanguage,
  fetchProfileImage,
  fetchProjects,
  fetchResume,
  toAbsoluteApiUrl,
  updateDefaultLanguage,
  updateProject,
  uploadProfileImage,
  uploadResume,
} from '../lib/api.ts'
import type { ProfileImageSummary } from '../types/profile-image.types.ts'
import type { Project } from '../types/project.types.ts'
import type { ResumeSummary } from '../types/resume.types.ts'
import { type LanguageCode, SUPPORTED_LANGUAGES } from '../i18n/index.ts'
import DocumentIcon from './DocumentIcon.tsx'

// ── Types ──────────────────────────────────────────────────────────────────

const emptyProjectForm = { title: '', description: '', href: '', tags: '', sortOrder: '0' }

type ProjectForm = typeof emptyProjectForm

type AdminState = {
  projects: Project[]
  profileImage: ProfileImageSummary | null
  resume: ResumeSummary | null
  selectedLanguage: LanguageCode
  projectForm: ProjectForm
  editingProjectId: string | null
  confirmDeleteId: string | null
  profileImageFile: File | null
  resumeFile: File | null
  isLoading: boolean
  isUploadingProfileImage: boolean
  isSavingProject: boolean
  isUploadingResume: boolean
  isSavingLanguage: boolean
  statusMessage: string | null
  errorMessage: string | null
}

type AdminAction =
  | { type: 'LOAD_SUCCESS'; projects: Project[]; resume: ResumeSummary | null; profileImage: ProfileImageSummary | null; language: LanguageCode }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'SET_PROJECT_FORM'; field: keyof ProjectForm; value: string }
  | { type: 'EDIT_PROJECT'; project: Project }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SAVE_PROJECT_START' }
  | { type: 'SAVE_PROJECT_SUCCESS'; project: Project; isEdit: boolean }
  | { type: 'SAVE_PROJECT_ERROR'; error: string }
  | { type: 'CONFIRM_DELETE'; projectId: string }
  | { type: 'CANCEL_DELETE' }
  | { type: 'DELETE_PROJECT_SUCCESS'; projectId: string }
  | { type: 'DELETE_PROJECT_ERROR'; error: string }
  | { type: 'SET_PROFILE_IMAGE_FILE'; file: File | null }
  | { type: 'UPLOAD_PROFILE_IMAGE_START' }
  | { type: 'UPLOAD_PROFILE_IMAGE_SUCCESS'; profileImage: ProfileImageSummary }
  | { type: 'UPLOAD_PROFILE_IMAGE_ERROR'; error: string }
  | { type: 'SET_RESUME_FILE'; file: File | null }
  | { type: 'UPLOAD_RESUME_START' }
  | { type: 'UPLOAD_RESUME_SUCCESS'; resume: ResumeSummary }
  | { type: 'UPLOAD_RESUME_ERROR'; error: string }
  | { type: 'SET_LANGUAGE'; language: LanguageCode }
  | { type: 'SAVE_LANGUAGE_START' }
  | { type: 'SAVE_LANGUAGE_SUCCESS'; message: string }
  | { type: 'SAVE_LANGUAGE_ERROR'; error: string }

// ── Helpers ────────────────────────────────────────────────────────────────

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    const diff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    return diff !== 0 ? diff : a.title.localeCompare(b.title)
  })
}

function formatDate(value?: string) {
  if (!value) return 'Not uploaded yet'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

// ── Reducer ────────────────────────────────────────────────────────────────

const initialState: AdminState = {
  projects: [],
  profileImage: null,
  resume: null,
  selectedLanguage: 'en',
  projectForm: emptyProjectForm,
  editingProjectId: null,
  confirmDeleteId: null,
  profileImageFile: null,
  resumeFile: null,
  isLoading: true,
  isUploadingProfileImage: false,
  isSavingProject: false,
  isUploadingResume: false,
  isSavingLanguage: false,
  statusMessage: null,
  errorMessage: null,
}

function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        projects: sortProjects(action.projects),
        resume: action.resume,
        profileImage: action.profileImage,
        selectedLanguage: action.language,
        errorMessage: null,
      }
    case 'LOAD_ERROR':
      return { ...state, isLoading: false, errorMessage: action.error }

    case 'SET_PROJECT_FORM':
      return { ...state, projectForm: { ...state.projectForm, [action.field]: action.value } }
    case 'EDIT_PROJECT':
      return {
        ...state,
        editingProjectId: action.project.id ?? null,
        projectForm: {
          title: action.project.title,
          description: action.project.description,
          href: action.project.href,
          tags: action.project.tags.join(', '),
          sortOrder: `${action.project.sortOrder ?? 0}`,
        },
        statusMessage: null,
        errorMessage: null,
      }
    case 'CANCEL_EDIT':
      return { ...state, editingProjectId: null, projectForm: emptyProjectForm }

    case 'SAVE_PROJECT_START':
      return { ...state, isSavingProject: true, errorMessage: null, statusMessage: null }
    case 'SAVE_PROJECT_SUCCESS': {
      const next = action.isEdit
        ? state.projects.map((p) => (p.id === action.project.id ? action.project : p))
        : [...state.projects, action.project]
      return {
        ...state,
        isSavingProject: false,
        projects: sortProjects(next),
        editingProjectId: null,
        projectForm: emptyProjectForm,
        statusMessage: action.isEdit ? 'Project updated.' : 'Project created.',
      }
    }
    case 'SAVE_PROJECT_ERROR':
      return { ...state, isSavingProject: false, errorMessage: action.error }

    case 'CONFIRM_DELETE':
      return { ...state, confirmDeleteId: action.projectId, errorMessage: null, statusMessage: null }
    case 'CANCEL_DELETE':
      return { ...state, confirmDeleteId: null }
    case 'DELETE_PROJECT_SUCCESS': {
      const projects = state.projects.filter((p) => p.id !== action.projectId)
      const editingProjectId =
        state.editingProjectId === action.projectId ? null : state.editingProjectId
      const projectForm =
        state.editingProjectId === action.projectId ? emptyProjectForm : state.projectForm
      return { ...state, projects, editingProjectId, projectForm, confirmDeleteId: null, statusMessage: 'Project deleted.' }
    }
    case 'DELETE_PROJECT_ERROR':
      return { ...state, confirmDeleteId: null, errorMessage: action.error }

    case 'SET_PROFILE_IMAGE_FILE':
      return { ...state, profileImageFile: action.file }
    case 'UPLOAD_PROFILE_IMAGE_START':
      return { ...state, isUploadingProfileImage: true, errorMessage: null, statusMessage: null }
    case 'UPLOAD_PROFILE_IMAGE_SUCCESS':
      return { ...state, isUploadingProfileImage: false, profileImage: action.profileImage, profileImageFile: null, statusMessage: 'Profile image updated.' }
    case 'UPLOAD_PROFILE_IMAGE_ERROR':
      return { ...state, isUploadingProfileImage: false, errorMessage: action.error }

    case 'SET_RESUME_FILE':
      return { ...state, resumeFile: action.file }
    case 'UPLOAD_RESUME_START':
      return { ...state, isUploadingResume: true, errorMessage: null, statusMessage: null }
    case 'UPLOAD_RESUME_SUCCESS':
      return { ...state, isUploadingResume: false, resume: action.resume, resumeFile: null, statusMessage: 'Resume updated.' }
    case 'UPLOAD_RESUME_ERROR':
      return { ...state, isUploadingResume: false, errorMessage: action.error }

    case 'SET_LANGUAGE':
      return { ...state, selectedLanguage: action.language }
    case 'SAVE_LANGUAGE_START':
      return { ...state, isSavingLanguage: true, errorMessage: null, statusMessage: null }
    case 'SAVE_LANGUAGE_SUCCESS':
      return { ...state, isSavingLanguage: false, statusMessage: action.message }
    case 'SAVE_LANGUAGE_ERROR':
      return { ...state, isSavingLanguage: false, errorMessage: action.error }

    default:
      return state
  }
}

// ── Component ──────────────────────────────────────────────────────────────

type AdminPageProps = {
  onProfileImageChange?: (profileImage: ProfileImageSummary | null) => void
  onLogout: () => void
}

function AdminPage({ onProfileImageChange, onLogout }: AdminPageProps) {
  const { t, i18n } = useTranslation()
  const [state, dispatch] = useReducer(adminReducer, initialState)

  const {
    projects, profileImage, resume, selectedLanguage,
    projectForm, editingProjectId, confirmDeleteId,
    profileImageFile, resumeFile,
    isLoading, isUploadingProfileImage, isSavingProject, isUploadingResume, isSavingLanguage,
    statusMessage, errorMessage,
  } = state

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const [projectList, resumeSummary, profileImageSummary, defaultLang] = await Promise.all([
          fetchProjects(),
          fetchResume(),
          fetchProfileImage(),
          fetchDefaultLanguage(),
        ])

        if (!isMounted) return

        dispatch({
          type: 'LOAD_SUCCESS',
          projects: projectList,
          resume: resumeSummary,
          profileImage: profileImageSummary,
          language: defaultLang as LanguageCode,
        })
        onProfileImageChange?.(profileImageSummary)
      } catch (error) {
        if (isMounted) {
          dispatch({ type: 'LOAD_ERROR', error: error instanceof Error ? error.message : 'Unable to load admin data.' })
        }
      }
    }

    void load()
    return () => { isMounted = false }
  }, [])

  const resumeLinks = useMemo(() => {
    if (!resume) return null
    return { view: toAbsoluteApiUrl(resume.viewUrl), download: toAbsoluteApiUrl(resume.downloadUrl) }
  }, [resume])

  const profileImageUrl = useMemo(
    () => (profileImage ? toAbsoluteApiUrl(profileImage.viewUrl) : null),
    [profileImage],
  )

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    dispatch({ type: 'SAVE_PROJECT_START' })

    try {
      const payload = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        href: projectForm.href.trim(),
        tags: projectForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        sortOrder: Number(projectForm.sortOrder || 0),
      }

      const saved = editingProjectId
        ? await updateProject(editingProjectId, payload)
        : await createProject(payload)

      dispatch({ type: 'SAVE_PROJECT_SUCCESS', project: saved, isEdit: !!editingProjectId })
    } catch (error) {
      dispatch({ type: 'SAVE_PROJECT_ERROR', error: error instanceof Error ? error.message : 'Unable to save project.' })
    }
  }

  const handleDeleteConfirmed = async (projectId: string) => {
    try {
      await deleteProject(projectId)
      dispatch({ type: 'DELETE_PROJECT_SUCCESS', projectId })
    } catch (error) {
      dispatch({ type: 'DELETE_PROJECT_ERROR', error: error instanceof Error ? error.message : 'Unable to delete project.' })
    }
  }

  const handleResumeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resumeFile) return

    dispatch({ type: 'UPLOAD_RESUME_START' })

    try {
      const next = await uploadResume(resumeFile)
      dispatch({ type: 'UPLOAD_RESUME_SUCCESS', resume: next })
    } catch (error) {
      dispatch({ type: 'UPLOAD_RESUME_ERROR', error: error instanceof Error ? error.message : 'Unable to upload resume.' })
    }
  }

  const handleProfileImageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profileImageFile) return

    dispatch({ type: 'UPLOAD_PROFILE_IMAGE_START' })

    try {
      const next = await uploadProfileImage(profileImageFile)
      dispatch({ type: 'UPLOAD_PROFILE_IMAGE_SUCCESS', profileImage: next })
      onProfileImageChange?.(next)
    } catch (error) {
      dispatch({ type: 'UPLOAD_PROFILE_IMAGE_ERROR', error: error instanceof Error ? error.message : 'Unable to upload profile image.' })
    }
  }

  const handleLanguageSave = async () => {
    dispatch({ type: 'SAVE_LANGUAGE_START' })

    try {
      await updateDefaultLanguage(selectedLanguage)
      void i18n.changeLanguage(selectedLanguage)
      dispatch({ type: 'SAVE_LANGUAGE_SUCCESS', message: t('admin.languageSaved') })
    } catch (error) {
      dispatch({ type: 'SAVE_LANGUAGE_ERROR', error: error instanceof Error ? error.message : 'Unable to update language.' })
    }
  }

  return (
    <main className="admin-page shell">
      <section className="admin-hero card">
        <div className="admin-hero-top">
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <button type="button" className="button button-secondary" onClick={onLogout}>
            {t('admin.logout')}
          </button>
        </div>
        <h1>{t('admin.title')}</h1>
        <p className="admin-lead">{t('admin.lead')}</p>

        {statusMessage ? <p className="admin-status admin-status-success">{statusMessage}</p> : null}
        {errorMessage ? <p className="admin-status admin-status-error">{errorMessage}</p> : null}
      </section>

      <section className="admin-grid">
        {/* Profile image */}
        <article className="card admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-title">
              <DocumentIcon />
              <div>
                <p className="project-label">{t('admin.brandImage')}</p>
                <h2>{t('admin.navbarProfileImage')}</h2>
              </div>
            </div>
          </div>

          <div className="admin-avatar-preview">
            {profileImageUrl ? (
              <img src={profileImageUrl} alt="Current navbar profile" />
            ) : (
              <span>A</span>
            )}
          </div>

          <div className="admin-resume-meta">
            <strong>{profileImage?.filename ?? t('admin.noProfileImage')}</strong>
            <span>{t('admin.lastUpdated')} {formatDate(profileImage?.updatedAt)}</span>
          </div>

          <form className="admin-form" onSubmit={handleProfileImageSubmit}>
            <label className="field">
              <span>{t('admin.uploadImageLabel')}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => dispatch({ type: 'SET_PROFILE_IMAGE_FILE', file: e.target.files?.[0] ?? null })}
              />
            </label>
            <button className="button button-primary" type="submit" disabled={isUploadingProfileImage || !profileImageFile}>
              {isUploadingProfileImage ? t('admin.uploading') : t('admin.uploadImage')}
            </button>
          </form>
        </article>

        {/* Resume */}
        <article className="card admin-card">
          <div className="admin-card-heading">
            <div className="admin-card-title">
              <DocumentIcon />
              <div>
                <p className="project-label">{t('admin.resume')}</p>
                <h2>{t('admin.currentResume')}</h2>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="section-lead">{t('admin.loadingResume')}</p>
          ) : (
            <>
              <div className="admin-resume-meta">
                <strong>{resume?.filename ?? t('admin.noResume')}</strong>
                <span>{t('admin.lastUpdated')} {formatDate(resume?.updatedAt)}</span>
              </div>

              {resumeLinks ? (
                <div className="admin-inline-actions">
                  <a className="button button-secondary button-icon" href={resumeLinks.view} target="_blank" rel="noreferrer">
                    <DocumentIcon />
                    <span>{t('admin.viewResume')}</span>
                  </a>
                  <a className="button button-primary button-icon" href={resumeLinks.download}>
                    <DocumentIcon />
                    <span>{t('admin.downloadResume')}</span>
                  </a>
                </div>
              ) : null}
            </>
          )}

          <form className="admin-form" onSubmit={handleResumeSubmit}>
            <label className="field">
              <span>{t('admin.uploadPdf')}</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => dispatch({ type: 'SET_RESUME_FILE', file: e.target.files?.[0] ?? null })}
              />
            </label>
            <button className="button button-primary" type="submit" disabled={isUploadingResume || !resumeFile}>
              {isUploadingResume ? t('admin.uploading') : t('admin.uploadResume')}
            </button>
          </form>
        </article>

        {/* Language */}
        <article className="card admin-card">
          <div className="admin-card-heading">
            <p className="project-label">{t('admin.language')}</p>
            <h2>{t('admin.languageLabel')}</h2>
          </div>

          <div className="admin-lang-selector">
            {SUPPORTED_LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                className={`button ${selectedLanguage === code ? 'button-primary' : 'button-secondary'}`}
                onClick={() => dispatch({ type: 'SET_LANGUAGE', language: code as LanguageCode })}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="button button-primary" type="button" onClick={handleLanguageSave} disabled={isSavingLanguage}>
            {isSavingLanguage ? t('admin.languageSaving') : t('admin.saveLanguage')}
          </button>
        </article>

        {/* Project form */}
        <article className="card admin-card">
          <div className="admin-card-heading">
            <p className="project-label">{t('admin.projects')}</p>
            <h2>{editingProjectId ? t('admin.editProject') : t('admin.addProject')}</h2>
          </div>

          <form className="admin-form" onSubmit={handleProjectSubmit}>
            <label className="field">
              <span>{t('admin.projectTitle')}</span>
              <input
                type="text"
                value={projectForm.title}
                onChange={(e) => dispatch({ type: 'SET_PROJECT_FORM', field: 'title', value: e.target.value })}
                placeholder="Modern dashboard platform"
              />
            </label>

            <label className="field">
              <span>{t('admin.projectDescription')}</span>
              <textarea
                rows={4}
                value={projectForm.description}
                onChange={(e) => dispatch({ type: 'SET_PROJECT_FORM', field: 'description', value: e.target.value })}
                placeholder="Short explanation of the project and your role."
              />
            </label>

            <label className="field">
              <span>{t('admin.projectLink')}</span>
              <input
                type="text"
                value={projectForm.href}
                onChange={(e) => dispatch({ type: 'SET_PROJECT_FORM', field: 'href', value: e.target.value })}
                placeholder="https://example.com or #projects"
              />
            </label>

            <label className="field">
              <span>{t('admin.projectTags')}</span>
              <input
                type="text"
                value={projectForm.tags}
                onChange={(e) => dispatch({ type: 'SET_PROJECT_FORM', field: 'tags', value: e.target.value })}
                placeholder="React, Node.js, MongoDB"
              />
            </label>

            <label className="field field-small">
              <span>{t('admin.projectSortOrder')}</span>
              <input
                type="number"
                value={projectForm.sortOrder}
                onChange={(e) => dispatch({ type: 'SET_PROJECT_FORM', field: 'sortOrder', value: e.target.value })}
              />
            </label>

            <div className="admin-inline-actions">
              <button className="button button-primary" type="submit" disabled={isSavingProject}>
                {isSavingProject ? t('admin.saving') : editingProjectId ? t('admin.updateProject') : t('admin.createProject')}
              </button>

              {editingProjectId ? (
                <button className="button button-secondary" type="button" onClick={() => dispatch({ type: 'CANCEL_EDIT' })}>
                  {t('admin.cancelEdit')}
                </button>
              ) : null}
            </div>
          </form>
        </article>
      </section>

      {/* Projects list */}
      <section className="section admin-projects">
        <div className="section-title">
          <p className="eyebrow">{t('admin.storedProjects')}</p>
          <h2>{t('admin.storedProjectsTitle')}</h2>
        </div>

        {isLoading ? (
          <p className="section-lead">{t('admin.loadingProjects')}</p>
        ) : projects.length === 0 ? (
          <div className="card">
            <p className="section-lead">{t('admin.noProjects')}</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((project) => (
              <article key={project.id ?? project.title} className="project-card card admin-project-card">
                <div className="project-card-top">
                  <p className="project-label">{t('admin.sortLabel', { order: project.sortOrder ?? 0 })}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                </div>

                <ul className="chip-list">
                  {project.tags.map((tag) => (
                    <li key={tag} className="chip">{tag}</li>
                  ))}
                </ul>

                {project.id ? (
                  <div className="admin-project-actions">
                    {confirmDeleteId === project.id ? (
                      <div className="admin-confirm-delete">
                        <p className="admin-confirm-text">{t('admin.confirmDelete')}</p>
                        <div className="admin-inline-actions">
                          <button
                            className="button button-primary"
                            type="button"
                            onClick={() => handleDeleteConfirmed(project.id!)}
                          >
                            {t('admin.confirmYes')}
                          </button>
                          <button
                            className="button button-secondary"
                            type="button"
                            onClick={() => dispatch({ type: 'CANCEL_DELETE' })}
                          >
                            {t('admin.confirmNo')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => dispatch({ type: 'EDIT_PROJECT', project })}
                        >
                          {t('admin.edit')}
                        </button>
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() => dispatch({ type: 'CONFIRM_DELETE', projectId: project.id! })}
                        >
                          {t('admin.delete')}
                        </button>
                      </>
                    )}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPage
