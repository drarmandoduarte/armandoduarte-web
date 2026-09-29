/**
 * El motor de i18n de Mi espacio.
 *
 * Mismo criterio que `apps/web/src/i18n.ts` y por el mismo motivo escrito allá:
 * **sin detector de idioma**. Acá hay un solo idioma y el namespace por defecto
 * es `familia`, no `web`.
 *
 * `cero texto en los componentes` (orden #15, A) es la regla que esto sostiene:
 * ninguna cadena que lea una persona se escribe en un `.tsx`.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { RECURSOS_I18N } from '@codice/core';

void i18n.use(initReactI18next).init({
  resources: RECURSOS_I18N,
  lng: 'es',
  fallbackLng: 'es',
  supportedLngs: ['es'],
  defaultNS: 'familia',
  interpolation: { escapeValue: false },
});

export default i18n;
