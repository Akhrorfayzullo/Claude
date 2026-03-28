import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n/index.ts'

type NavbarProps = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  isAdminView?: boolean
  profileImageUrl?: string | null
  isScrolled?: boolean
}

const LANGUAGE_META: Record<LanguageCode, { flag: string; shortLabel: string }> = {
  en: { flag: '🇺🇸', shortLabel: 'EN' },
  ko: { flag: '🇰🇷', shortLabel: 'KO' },
  uz: { flag: '🇺🇿', shortLabel: 'UZ' },
}

function Navbar({
  theme,
  onToggleTheme,
  isAdminView = false,
  profileImageUrl,
  isScrolled = false,
}: NavbarProps) {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const currentLanguage =
    SUPPORTED_LANGUAGES.find(({ code }) => i18n.language.startsWith(code))?.code ?? 'en'
  const currentLanguageIndex = SUPPORTED_LANGUAGES.findIndex(({ code }) => code === currentLanguage)
  const nextLanguage =
    SUPPORTED_LANGUAGES[(currentLanguageIndex + 1) % SUPPORTED_LANGUAGES.length]?.code ?? 'en'

  const navItems = [
    { href: '#about', label: t('nav.about') },
    { href: '#skills', label: t('nav.skills') },
    { href: '#projects', label: t('nav.projects') },
    { href: '#contact', label: t('nav.contact') },
  ]

  const links = isAdminView ? [{ href: '/', label: t('nav.backToSite') }] : navItems

  const handleLanguageChange = (code: LanguageCode) => {
    void i18n.changeLanguage(code)
  }

  const handleLanguageToggle = () => {
    handleLanguageChange(nextLanguage)
  }

  return (
    <header className={`site-header ${isScrolled ? 'site-header-scrolled' : ''}`}>
      <nav className="nav shell" aria-label="Primary">
        <a className="brand" href={isAdminView ? '/' : '#hero'}>
          <span className="brand-mark">
            {profileImageUrl ? (
              <img className="brand-image" src={profileImageUrl} alt="Akhrorbek profile" />
            ) : (
              'A'
            )}
          </span>
          <span>Akhrorbek</span>
        </a>

        <button
          type="button"
          className="nav-hamburger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-actions ${menuOpen ? 'nav-actions-open' : ''}`}>
          <div className="nav-links">
            {links.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                {item.label}
              </a>
            ))}

            {!isAdminView ? (
              <a href="/admin" onClick={() => setMenuOpen(false)}>
                {t('nav.admin')}
              </a>
            ) : null}
          </div>

          <div className="nav-controls">
            <button
              type="button"
              className="lang-toggle"
              onClick={handleLanguageToggle}
              aria-label={`Switch language. Current language ${currentLanguage}.`}
              title={`Current language: ${currentLanguage.toUpperCase()}. Click to switch.`}
            >
              <span className="lang-toggle-flag" aria-hidden="true">
                {LANGUAGE_META[currentLanguage].flag}
              </span>
              <span className="lang-toggle-code">{LANGUAGE_META[currentLanguage].shortLabel}</span>
            </button>

            <button
              type="button"
              className={`theme-toggle ${theme === 'light' ? 'theme-toggle-active' : ''}`}
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="theme-toggle-track" aria-hidden="true">
                <span className="theme-toggle-thumb">
                  <span className="theme-toggle-icon">{theme === 'dark' ? '☾' : '☀'}</span>
                </span>
              </span>
              <span className="theme-toggle-label">
                {theme === 'dark' ? t('theme.light') : t('theme.dark')}
              </span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
