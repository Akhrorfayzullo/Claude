import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ko from './locales/ko.json'
import uz from './locales/uz.json'
import flagUs from 'flag-icons/flags/4x3/us.svg'
import flagKr from 'flag-icons/flags/4x3/kr.svg'
import flagUz from 'flag-icons/flags/4x3/uz.svg'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flagUrl: flagUs as string },
  { code: 'ko', label: '한국어', flagUrl: flagKr as string },
  { code: 'uz', label: "O'zbekcha", flagUrl: flagUz as string },
] as const

export type LanguageCode = 'en' | 'ko' | 'uz'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
    uz: { translation: uz },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
