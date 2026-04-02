import { useTranslation } from 'react-i18next'
import { toAbsoluteApiUrl } from '../lib/api.ts'
import type { ResumeSummary } from '../types/resume.types.ts'
import ScrollReveal from './ScrollReveal.tsx'
import SectionTitle from './SectionTitle.tsx'

type ResumeSectionProps = {
  resume: ResumeSummary | null
}

function ResumeSection({ resume }: ResumeSectionProps) {
  const { t } = useTranslation()
  const viewUrl = resume ? toAbsoluteApiUrl(resume.viewUrl) : null
  const downloadUrl = resume ? toAbsoluteApiUrl(resume.downloadUrl) : null

  return (
    <section id="resume" className="section shell">
      <ScrollReveal>
        <SectionTitle eyebrow={t('resume.eyebrow')} title={t('resume.title')} />

        {viewUrl && downloadUrl ? (
          <div className="resume-wrapper">
            <div className="resume-embed-container card">
              <iframe
                src={viewUrl}
                className="resume-embed"
                title={t('resume.title')}
              />
            </div>
            <div className="resume-actions">
              <a href={downloadUrl} download className="button button-primary">
                {t('resume.download')}
              </a>
            </div>
          </div>
        ) : (
          <div className="card">
            <p className="section-lead">{t('resume.empty')}</p>
          </div>
        )}
      </ScrollReveal>
    </section>
  )
}

export default ResumeSection
