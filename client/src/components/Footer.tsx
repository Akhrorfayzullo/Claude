import { useTranslation } from 'react-i18next'
import ScrollReveal from './ScrollReveal.tsx'

function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="site-footer shell">
      <ScrollReveal className="footer-reveal">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        <a href="#hero">{t('footer.backToTop')}</a>
      </ScrollReveal>
    </footer>
  )
}

export default Footer
