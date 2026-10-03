/**
 * El motor de i18n de Mi espacio.
 *
 * Mismo criterio que `apps/web/src/i18n.ts`: **sin detector de idioma** (no se
 * adivina por el navegador). El namespace por defecto es `familia`.
 *
 * ── Tres idiomas desde la #35, solo en el acceso ──────────────────────────
 * El guion v1 del Kit 512 pide las pantallas de acceso en español, inglés y
 * portugués, con un selector que «cambia la pantalla en el momento y se
 * recuerda» (§2). Lo elegido se guarda en el navegador (`comun/idioma.ts`) y
 * arranca con eso. `en` y `pt` traen solo `auth.*`: todo lo demás cae a `es`
 * por `fallbackLng`, que es «el resto de la app sigue en español».
 *
 * `cero texto en los componentes` (orden #15, A) es la regla que esto sostiene:
 * ninguna cadena que lea una persona se escribe en un `.tsx`.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { IDIOMAS, RECURSOS_I18N } from '@codice/core';
import { idiomaGuardado } from './comun/idioma';

void i18n.use(initReactI18next).init({
  resources: RECURSOS_I18N,
  lng: idiomaGuardado(),
  fallbackLng: 'es',
  supportedLngs: [...IDIOMAS],
  defaultNS: 'familia',
  interpolation: { escapeValue: false },
});

export default i18n;
