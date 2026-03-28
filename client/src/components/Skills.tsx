import { useTranslation } from 'react-i18next'
import { skills } from '../data/skills.ts'
import ScrollReveal from './ScrollReveal.tsx'
import SectionTitle from './SectionTitle.tsx'

const groupedSkills = Object.entries(
  skills.reduce<Record<string, string[]>>((accumulator, skill) => {
    accumulator[skill.category] ??= []
    accumulator[skill.category].push(skill.name)
    return accumulator
  }, {}),
)

function Skills() {
  const { t } = useTranslation()

  return (
    <section id="skills" className="section shell">
      <ScrollReveal>
        <SectionTitle eyebrow={t('skills.eyebrow')} title={t('skills.title')} />

        <div className="skills-grid">
          {groupedSkills.map(([category, items]) => (
            <article key={category} className="card skill-group">
              <p className="project-label">{category}</p>
              <h3>
                {category} {t('skills.toolkit')}
              </h3>
              <ul className="chip-list">
                {items.map((item) => (
                  <li key={item} className="chip">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </ScrollReveal>
    </section>
  )
}

export default Skills
