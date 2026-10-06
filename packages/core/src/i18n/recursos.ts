/* Recursos de i18n de Códice. `es` es la fuente.
   Ningún texto de la interfaz vive fuera de estos archivos.

   Hoy hay un solo idioma y un solo namespace, y las dos cosas son a propósito:
   la web pública es de Armando, que escribe en español de México, y D13 pide
   es/en/pt para la plataforma — cuando entre, `en/` y `pt/` son dos carpetas
   hermanas de `es/` y `scripts/check-i18n-parity.mjs` empieza a compararlas sin
   tocar una línea. Mientras tanto no se quejan: el guardián tolera un idioma
   solo, y lo dice.

   ── Dos namespaces desde la #15 ─────────────────────────────────────────
   `web` es la web pública (`apps/web`) y `familia` es Mi espacio
   (`apps/familia`). Van separados y no en un `web.json` que crezca porque son
   dos productos con dos vidas: la web la edita el equipo de Armando (D23) y Mi
   espacio no lo ve nadie de afuera. Un archivo por app también hace que
   `check-i18n-parity` diga cuál de los dos perdió una clave el día que entren
   `en/` y `pt/`. */
import esWeb from './es/web.json';
import esFamilia from './es/familia.json';
import enFamilia from './en/familia.json';
import ptFamilia from './pt/familia.json';
import esMolde from './es/molde.json';
import enMolde from './en/molde.json';
import ptMolde from './pt/molde.json';

/* ── en y pt, desde la #35, solo para el acceso ────────────────────────────
   El guion v1 del Kit 512 pide las pantallas de acceso en tres idiomas (§5).
   `en/familia.json` y `pt/familia.json` traen **solo `auth.*`**; el resto de
   Mi espacio y la web siguen en español y caen a `es` por `fallbackLng`.
   `check-i18n-parity` lo sabe: en esos dos compara solo `auth.*`. */
export const IDIOMAS = ['es', 'en', 'pt'] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const RECURSOS_I18N = {
  es: { web: esWeb, familia: esFamilia },
  en: { familia: enFamilia },
  pt: { familia: ptFamilia },
} as const;

/* ── Los textos de Mi espacio en las pantallas del molde (#37, PR 3) ──────
   Ajustes, Inicio, el shell, el Centro de alertas, la Papelera, Equipo y la
   Bienvenida van en los tres idiomas (fase-2 §5). Sus textos propios están en
   `molde.json`, **planos y con la sintaxis del molde** (`{x}`, `{n|uno|varios}`,
   la palabra acentuada entre asteriscos), porque los lee el `t` del molde
   (`crearT`, como `extras`) y no i18next. Algunos pisan un texto del molde
   que en Mi espacio diría algo que no pasa (están al final del archivo y en el
   informe). `check-i18n-parity` los compara enteros en los tres idiomas. */
export const TEXTOS_DEL_MOLDE = { es: esMolde, en: enMolde, pt: ptMolde } as const;
