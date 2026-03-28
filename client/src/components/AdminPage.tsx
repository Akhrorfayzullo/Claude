import { useEffect, useMemo, useState, type FormEvent } from 'react'
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

const emptyProjectForm = {
  title: '',
  description: '',
  href: '',
  tags: '',
  sortOrder: '0',
}

function formatDate(value?: string) {
  if (!value) {
    return 'Not uploaded yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => {
    const leftOrder = left.sortOrder ?? 0
    const rightOrder = right.sortOrder ?? 0

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.title.localeCompare(right.title)
  })
}

type AdminPageProps = {
  onProfileImageChange?: (profileImage: ProfileImageSummary | null) => void
  onLogout: () => void
}

function AdminPage({ onProfileImageChange, onLogout }: AdminPageProps) {
  const { t, i18n } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [profileImage, setProfileImage] = useState<ProfileImageSummary | null>(null)
  const [resume, setResume] = useState<ResumeSummary | null>(null)
  const [projectForm, setProjectForm] = useState(emptyProjectForm)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false)
  const [isSavingProject, setIsSavingProject] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isSavingLanguage, setIsSavingLanguage] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadAdminData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const [projectList, resumeSummary, profileImageSummary, defaultLang] = await Promise.all([
          fetchProjects(),
          fetchResume(),
          fetchProfileImage(),
          fetchDefaultLanguage(),
        ])

        if (!isMounted) {
          return
        }

        setProjects(sortProjects(projectList))
        setResume(resumeSummary)
        setProfileImage(profileImageSummary)
        onProfileImageChange?.(profileImageSummary)
        setSelectedLanguage(defaultLang as LanguageCode)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setErrorMessage(error instanceof Error ? error.message : 'Unable to load admin data.')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAdminData()

    return () => {
      isMounted = false
    }
  }, [])

  const resumeLinks = useMemo(() => {
    if (!resume) {
      return null
    }

    return {
      view: toAbsoluteApiUrl(resume.viewUrl),
      download: toAbsoluteApiUrl(resume.downloadUrl),
    }
  }, [resume])

  const profileImageUrl = useMemo(() => {
    if (!profileImage) {
      return null
    }

    return toAbsoluteApiUrl(profileImage.viewUrl)
  }, [profileImage])

  const resetProjectForm = () => {
    setProjectForm(emptyProjectForm)
    setEditingProjectId(null)
  }

  const handleProjectSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSavingProject(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const payload = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        href: projectForm.href.trim(),
        tags: projectForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        sortOrder: Number(projectForm.sortOrder || 0),
      }

      const savedProject = editingProjectId
        ? await updateProject(editingProjectId, payload)
        : await createProject(payload)

      setProjects((currentProjects) => {
        const nextProjects = editingProjectId
          ? currentProjects.map((project) =>
              project.id === editingProjectId ? savedProject : project,
            )
          : [...currentProjects, savedProject]

        return sortProjects(nextProjects)
      })

      setStatusMessage(editingProjectId ? t('admin.updateProject') + ' ✓' : t('admin.createProject') + ' ✓')
      resetProjectForm()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save project.')
    } finally {
      setIsSavingProject(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProjectId(project.id ?? null)
    setProjectForm({
      title: project.title,
      description: project.description,
      href: project.href,
      tags: project.tags.join(', '),
      sortOrder: `${project.sortOrder ?? 0}`,
    })
    setStatusMessage(null)
    setErrorMessage(null)
  }

  const handleDeleteProject = async (projectId: string) => {
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await deleteProject(projectId)
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId),
      )
      setStatusMessage('Project deleted.')

      if (editingProjectId === projectId) {
        resetProjectForm()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete project.')
    }
  }

  const handleResumeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!resumeFile) {
      setErrorMessage('Choose a PDF file before uploading.')
      return
    }

    setIsUploadingResume(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const nextResume = await uploadResume(resumeFile)
      setResume(nextResume)
      setResumeFile(null)
      setStatusMessage('Resume updated.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to upload resume.')
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleProfileImageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!profileImageFile) {
      setErrorMessage('Choose an image file before uploading.')
      return
    }

    setIsUploadingProfileImage(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      const nextProfileImage = await uploadProfileImage(profileImageFile)
      setProfileImage(nextProfileImage)
      onProfileImageChange?.(nextProfileImage)
      setProfileImageFile(null)
      setStatusMessage('Profile image updated.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to upload profile image.')
    } finally {
      setIsUploadingProfileImage(false)
    }
  }

  const handleLanguageSave = async () => {
    setIsSavingLanguage(true)
    setErrorMessage(null)
    setStatusMessage(null)

    try {
      await updateDefaultLanguage(selectedLanguage)
      void i18n.changeLanguage(selectedLanguage)
      setStatusMessage(t('admin.languageSaved'))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update language.')
    } finally {
      setIsSavingLanguage(false)
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
                onChange={(event) => setProfileImageFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <button
              className="button button-primary"
              type="submit"
              disabled={isUploadingProfileImage}
            >
              {isUploadingProfileImage ? t('admin.uploading') : t('admin.uploadImage')}
            </button>
          </form>
        </article>

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
                onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <button className="button button-primary" type="submit" disabled={isUploadingResume}>
              {isUploadingResume ? t('admin.uploading') : t('admin.uploadResume')}
            </button>
          </form>
        </article>

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
                onClick={() => setSelectedLanguage(code as LanguageCode)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            className="button button-primary"
            type="button"
            onClick={handleLanguageSave}
            disabled={isSavingLanguage}
          >
            {isSavingLanguage ? t('admin.languageSaving') : t('admin.saveLanguage')}
          </button>
        </article>

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
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Modern dashboard platform"
              />
            </label>

            <label className="field">
              <span>{t('admin.projectDescription')}</span>
              <textarea
                rows={4}
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Short explanation of the project and your role."
              />
            </label>

            <label className="field">
              <span>{t('admin.projectLink')}</span>
              <input
                type="text"
                value={projectForm.href}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, href: event.target.value }))
                }
                placeholder="https://example.com or #projects"
              />
            </label>

            <label className="field">
              <span>{t('admin.projectTags')}</span>
              <input
                type="text"
                value={projectForm.tags}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, tags: event.target.value }))
                }
                placeholder="React, Node.js, MongoDB"
              />
            </label>

            <label className="field field-small">
              <span>{t('admin.projectSortOrder')}</span>
              <input
                type="number"
                value={projectForm.sortOrder}
                onChange={(event) =>
                  setProjectForm((current) => ({ ...current, sortOrder: event.target.value }))
                }
              />
            </label>

            <div className="admin-inline-actions">
              <button className="button button-primary" type="submit" disabled={isSavingProject}>
                {isSavingProject
                  ? t('admin.saving')
                  : editingProjectId
                    ? t('admin.updateProject')
                    : t('admin.createProject')}
              </button>

              {editingProjectId ? (
                <button className="button button-secondary" type="button" onClick={resetProjectForm}>
                  {t('admin.cancelEdit')}
                </button>
              ) : null}
            </div>
          </form>
        </article>
      </section>

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
                    <li key={tag} className="chip">
                      {tag}
                    </li>
                  ))}
                </ul>

                <div className="admin-project-actions">
                  {project.id ? (
                    <>
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => handleEditProject(project)}
                      >
                        {t('admin.edit')}
                      </button>
                      <button
                        className="button button-primary"
                        type="button"
                        onClick={() => handleDeleteProject(project.id!)}
                      >
                        {t('admin.delete')}
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPage
