import type { Project } from '../types/project.types.ts'

type ProjectCardProps = {
  project: Project
}

function ProjectCard({ project }: ProjectCardProps) {
  const isExternalLink = /^https?:\/\//.test(project.href)

  return (
    <article className="project-card card">
      <div className="project-card-top">
        <p className="project-label">Featured Project</p>
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

      <a
        className="project-link"
        href={project.href}
        target={isExternalLink ? '_blank' : undefined}
        rel={isExternalLink ? 'noreferrer' : undefined}
      >
        View project
      </a>
    </article>
  )
}

export default ProjectCard
