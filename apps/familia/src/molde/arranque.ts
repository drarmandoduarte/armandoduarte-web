import { aplicarDesign } from '@moldes/design';
import { crearT, elegirIdioma, type Idioma, type T } from '@moldes/idiomas';
import { RECURSOS_I18N, TEXTOS_DEL_MOLDE } from '@codice/core';
import type { Design } from '@moldes/design';
import designDelRepo from '../../design.json';
import { idiomaGuardado } from '../comun/idioma';

/**
 * El molde 1.1.2 en Mi espacio — orden #37, PR 1 (fase-2 §1).
 *
 * ── Lo que hace una vez, antes de montar React ───────────────────────────
 * `aplicarDesign(design)` enlaza `/design.css` (las variables de claro y oscuro
 * que escribe `generar-css.mjs`) y `/fuentes/fuentes.css` (las fuentes propias
 * de `bajar-fuentes.mjs`), con `<link>` y sin escribir ningún `<style>`: la CSP
 * de Mi espacio es `style-src 'self'`, y un `<style>` no se aplicaría.
 *
 * ── Y el `t` del molde ───────────────────────────────────────────────────
 * Las pantallas que la app arma con piezas del molde (el acceso, y desde el
 * PR 3 el shell, Inicio, Ajustes, el Centro de alertas, la Papelera, Equipo y
 * la Bienvenida) pasan sus textos por este `t`. Las del negocio (talleres, el
 * panel) siguen con i18next (`src/i18n.ts`). El molde trae `comun.cerrar`,
 * `comun.confirmar`… en los tres idiomas, y la app suma los suyos.
 */

/** Un JSON anidado de i18next (`{ auth: { login: { … } } }`) → plano (`auth.login.…`). */
export function aplanar(objeto: Record<string, unknown>, prefijo = ''): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(objeto)) {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;
    if (typeof valor === 'string') salida[ruta] = valor;
    else if (valor && typeof valor === 'object') Object.assign(salida, aplanar(valor as Record<string, unknown>, ruta));
  }
  return salida;
}

/**
 * Los textos de Mi espacio en cada idioma del molde: los de `familia.json`
 * (aplanados; en `en` y `pt`, los que esas pantallas usan) y, encima, los de
 * `molde.json` (#37 PR 3), que son los de las pantallas del molde y algunos que
 * pisan un texto del molde que en Mi espacio diría algo que no pasa.
 */
export const EXTRAS = {
  es: { ...aplanar(RECURSOS_I18N.es.familia), ...TEXTOS_DEL_MOLDE.es },
  en: { ...aplanar(RECURSOS_I18N.en.familia), ...TEXTOS_DEL_MOLDE.en },
  pt: { ...aplanar(RECURSOS_I18N.pt.familia), ...TEXTOS_DEL_MOLDE.pt },
} as const;

/**
 * El idioma: el del perfil cuando lo haya (PR 3), si no el que se eligió en
 * este aparato (el selector del acceso, #35), si no el del navegador.
 */
/* El JSON importado tipa `espanol` como `string`; el contrato del molde, como
   `'neutro' | 'voseo'`. `validar()` lo afirma en `tokens.test.mjs`. */
const design = designDelRepo as Design;

export function idiomaDeArranque(perfil: string | null = null): Idioma {
  let navegador: string | null = null;
  try { navegador = globalThis.navigator?.language ?? null; } catch { navegador = null; }
  let aparato: string | null = null;
  try { aparato = globalThis.localStorage?.getItem('codice.idioma') ? idiomaGuardado() : null; } catch { aparato = null; }
  return elegirIdioma({ perfil, aparato, navegador });
}

export function tDelMolde(idioma: Idioma = idiomaDeArranque()): T {
  return crearT({
    idioma,
    espanol: design.app.espanol,
    extras: EXTRAS,
    comunes: { app: design.app.nombre },
  });
}

/** Lo que `main.tsx` llama una sola vez, antes de `createRoot`. */
export function arrancarElMolde(): void {
  aplicarDesign(design);
}

export { design };
