import { useTranslation } from 'react-i18next'
import SectionTitle from './SectionTitle.tsx'
import ScrollReveal from './ScrollReveal.tsx'

function Contact() {
  const { t } = useTranslation()

  const contactItems = [
    {
      label: t('contact.email'),
      value: 'akhrorfayzullo@gmail.com',
      href: 'mailto:akhrorfayzullo@gmail.com',
    },
    {
      label: t('contact.github'),
      value: 'github.com/Akhrorfayzullo',
      href: 'https://github.com/Akhrorfayzullo',
    },
    {
      label: t('contact.location'),
      value: t('contact.availability'),
      href: '#contact',
    },
  ]

  return (
    <section id="contact" className="section shell">
      <ScrollReveal>
        <SectionTitle eyebrow={t('contact.eyebrow')} title={t('contact.title')} />

        <div className="contact-layout">
          <div className="card">
            <p className="section-lead">{t('contact.lead')}</p>
            <a className="button button-primary" href="mailto:akhrorfayzullo@gmail.com">
              {t('contact.startConversation')}
            </a>
          </div>

          <div className="contact-list">
            {contactItems.map((item) => (
              <a key={item.label} className="info-card contact-card" href={item.href}>
                <span className="contact-label">{item.label}</span>
                <strong>{item.value}</strong>
              </a>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

export default Contact
