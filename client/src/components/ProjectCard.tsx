import { useTranslation } from 'react-i18next'
import { toAbsoluteApiUrl } from '../lib/api.ts'
import type { Project } from '../types/project.types.ts'

type ProjectCardProps = {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation()
  const isExternalLink = /^https?:\/\//.test(project.href)
  const imageUrl = project.imageUrl ? toAbsoluteApiUrl(project.imageUrl) : null

  return (
    <a
      className="project-card card project-card-link"
      href={project.href}
      target={isExternalLink ? '_blank' : undefined}
      rel={isExternalLink ? 'noreferrer' : undefined}
      aria-label={`${project.title} — ${t('projects.openProject')}`}
    >
      {imageUrl ? (
        <div className="project-card-image">
          <img src={imageUrl} alt={project.title} loading="lazy" />
        </div>
      ) : null}

      <div className="project-card-body">
        <div className="project-card-top">
          <p className="project-label">{t('projects.featuredLabel')}</p>
          <h3>{project.title}</h3>
          <p className="project-description">{project.description}</p>
        </div>

        <div className="project-card-footer">
          <div className="project-tags-wrap">
            <ul className="chip-list">
              {project.tags.map((tag) => (
                <li key={tag} className="chip">
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          <span className="project-card-arrow" aria-hidden="true">↗</span>
        </div>
      </div>
    </a>
  )
}

export default ProjectCard
