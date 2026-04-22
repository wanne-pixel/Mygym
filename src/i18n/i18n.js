import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './ko.json';
import en from './en.json';

const saved = localStorage.getItem('mygym_lang');
const browserLang = (navigator.language || 'ko').split('-')[0];
const lng = saved || (['ko', 'en'].includes(browserLang) ? browserLang : 'ko');

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng,
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

export default i18n;
