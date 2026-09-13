/**
 * Motor de i18n. `es` es la fuente y hoy el único idioma (D13 pide es/en/pt
 * para la plataforma; la web pública de Armando es de México y nace en español).
 *
 * ── Sin detector de idioma, y es una decisión ─────────────────────────────
 * Omnia aprendió en carne propia que `navigator.language` no puede decidir: una
 * clínica uruguaya con Chrome en inglés entraba en inglés. Acá el caso ni se
 * plantea —hay un idioma— y por eso no entra la dependencia: el día que entren
 * en y pt, entra con ellos y con su regla escrita, no antes. Una dependencia que
 * no hace nada todavía es una dependencia que nadie sabe por qué está.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { RECURSOS_I18N } from '@codice/core';

void i18n.use(initReactI18next).init({
  resources: RECURSOS_I18N,
  lng: 'es',
  fallbackLng: 'es',
  supportedLngs: ['es'],
  defaultNS: 'web',
  interpolation: { escapeValue: false },
});

export default i18n;
