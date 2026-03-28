import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n/index.ts'

const ownerName = import.meta.env.VITE_OWNER_NAME || 'Akhrorbek'

type NavbarProps = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  isAdminView?: boolean
  profileImageUrl?: string | null
  isScrolled?: boolean
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

  const navItems = [
    { href: '#about', label: t('nav.about') },
    { href: '#skills', label: t('nav.skills') },
    { href: '#projects', label: t('nav.projects') },
    { href: '#contact', label: t('nav.contact') },
  ]

  const links = isAdminView ? [{ href: '/', label: t('nav.backToSite') }] : navItems

  return (
    <header className={`site-header ${isScrolled ? 'site-header-scrolled' : ''}`}>
      <nav className="nav shell" aria-label="Primary">
        <a className="brand" href={isAdminView ? '/' : '#hero'}>
          <span className="brand-mark">
            {profileImageUrl ? (
              <img className="brand-image" src={profileImageUrl} alt={`${ownerName} profile`} />
            ) : (
              ownerName.charAt(0).toUpperCase()
            )}
          </span>
          <span>{ownerName}</span>
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
            <div className="lang-switcher">
              {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  className={`lang-btn ${i18n.language === code ? 'lang-btn-active' : ''}`}
                  onClick={() => void i18n.changeLanguage(code as LanguageCode)}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="theme-toggle-orb" />
              <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
