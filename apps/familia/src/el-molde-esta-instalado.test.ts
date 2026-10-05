/**
 * El molde 1.1.2 está instalado en Mi espacio — orden #37, PR 1 (fase-2 §1, §2, §4).
 *
 * El guardián de los moldes (`guardian/check.mjs`) cuida que la COPIA sea
 * idéntica. Este archivo cuida lo que el guardián no ve, que es cómo la app
 * la usa:
 *
 *   · §1 — `pnpm test` de la raíz empieza con la línea del guardián, tal cual;
 *     `main.tsx` importa `@moldes/ui/styles.css` y llama `arrancarElMolde()`
 *     antes de `createRoot`; `moldes/instalacion.json` solo tiene claves del
 *     molde; `t` se arma con `crearT` y sabe los textos del molde y los de la
 *     app en los tres idiomas.
 *   · §2 — cada pieza heredada que se use desde `@moldes/ui` lleva su texto
 *     para lectores de pantalla. Hoy Mi espacio no usa ninguna (el barrido lo
 *     cuenta y lo dice); la regla queda armada para el PR 2 y el PR 3.
 *   · §4 — `espanol: 'neutro'`, que es lo que sostiene la excepción de
 *     `check:estilo` para la capa de voseo del molde.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aplanar, arrancarElMolde, design, tDelMolde } from './molde/arranque';

const SRC = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(SRC, '..', '..', '..');
const leer = (...ruta: string[]) => readFileSync(join(...ruta), 'utf8');

/** La línea de fase-2 §1, tal cual (con la barra simple: ya leída del JSON). */
const LINEA_DEL_GUARDIAN = "grep -E '  guardian/(check|huellas|revisar)\\.mjs$' HUELLAS.txt | sha256sum -c - && node guardian/check.mjs";

describe('§1 · el molde se instaló como dice fase-2', () => {
  it('el `test` de la raíz empieza con la línea del guardián, y después sigue el de la casa', () => {
    const test = (JSON.parse(leer(RAIZ, 'package.json')) as { scripts: Record<string, string> }).scripts.test;
    expect(test.startsWith(`${LINEA_DEL_GUARDIAN} && `), test).toBe(true);
    expect(test.endsWith('node scripts/guardian-de-guardianes.mjs')).toBe(true);
  });

  it('la línea es la misma que el molde corre en su propio `test`', () => {
    /* El `package.json` del molde no se copia (no es un paquete), así que la
       referencia es la del `guardian-del-kit.spec.ts` que el molde trae para
       el CI de cada app: el mismo texto. */
    const spec = leer(RAIZ, 'packages', 'moldes', 'acceso', 'tests-por-app', 'guardian-del-kit.spec.ts');
    expect(spec).toContain("guardian/(check|huellas|revisar)");
    expect(spec).toContain('node guardian/check.mjs');
  });

  it('moldes/instalacion.json: los paquetes en packages/moldes, y nada que el guardián no admita', () => {
    const instalacion = JSON.parse(leer(RAIZ, 'moldes', 'instalacion.json')) as Record<string, unknown>;
    expect(instalacion.paquetes).toBe('packages/moldes');
    /* `acceso` entra en el PR 2, con el núcleo: declararlo antes pone rojo al
       guardián (exige `acceso.config.ts` y `nucleo/` en las dos carpetas). */
    expect(Object.keys(instalacion).every((k) => ['paquetes', 'acceso'].includes(k))).toBe(true);
    for (const archivo of ['HUELLAS.txt', 'VERSION', 'guardian/check.mjs', 'guardian/huellas.mjs', 'guardian/revisar.mjs']) {
      expect(existsSync(join(RAIZ, archivo)), archivo).toBe(true);
    }
    expect(leer(RAIZ, 'VERSION').trim()).toBe('1.1.2');
  });

  it('main.tsx: el Kit UI del molde antes que la hoja de la casa, y el design enlazado antes de montar React', () => {
    const main = leer(SRC, 'main.tsx');
    const kit = main.indexOf("import '@moldes/ui/styles.css';");
    const casa = main.indexOf("import '@codice/ui/styles.css';");
    expect(kit, 'falta el import del Kit UI').toBeGreaterThan(-1);
    expect(casa, 'falta la hoja de la casa').toBeGreaterThan(kit);
    const arranque = main.indexOf('arrancarElMolde();');
    expect(arranque, 'falta arrancarElMolde()').toBeGreaterThan(-1);
    expect(main.indexOf('createRoot(raiz)'), 'el design se enlaza ANTES de montar').toBeGreaterThan(arranque);
  });

  it('arrancarElMolde() enlaza /design.css y /fuentes/fuentes.css con <link>, y no escribe ningún <style>', () => {
    document.head.innerHTML = '';
    arrancarElMolde();
    const hrefs = [...document.head.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual(expect.arrayContaining(['/design.css', '/fuentes/fuentes.css']));
    expect(document.querySelectorAll('style').length, 'con `style-src self` un <style> no se aplica').toBe(0);
  });

  it('t: los textos del molde y los de Mi espacio, en los tres idiomas', () => {
    const CERRAR = { es: 'Cerrar', en: 'Close', pt: 'Fechar' } as const;
    for (const idioma of ['es', 'en', 'pt'] as const) {
      const t = tDelMolde(idioma);
      expect(t.idioma).toBe(idioma);
      expect(t('comun.cerrar'), `comun.cerrar en ${idioma}`).toBe(CERRAR[idioma]);
    }
    /* Y un texto propio de la app, que entra por `extras`. */
    const propio = Object.keys(aplanar({ a: { b: 'x' } }))[0];
    expect(propio).toBe('a.b');
    const es = tDelMolde('es');
    expect(es.existe('auth.login.titleDefault'), 'el molde trae el título genérico').toBe(true);
  });
});

describe('§2 · cada pieza heredada del molde con su texto para lectores de pantalla', () => {
  /** Pieza → props que tiene que llevar (fase-2 §2). */
  const PIEZAS: Record<string, string[]> = {
    Dialog: ['closeLabel'],
    PanelLateral: ['closeLabel'],
    HojaInferior: ['closeLabel'],
    Toast: ['closeLabel'],
    ConfirmDialog: ['confirmLabel', 'cancelLabel'],
    Tag: ['removeLabel'],
    BarraInferior: ['etiqueta'],
    SelectorConAlta: ['agregar'],
    Panel: ['etiquetaCerrar'],
  };

  function tsx(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const ruta = join(dir, n);
      if (statSync(ruta).isDirectory()) return n === 'node_modules' ? [] : tsx(ruta);
      return /\.tsx$/.test(n) && !/\.test\.tsx$/.test(n) ? [ruta] : [];
    });
  }

  /* Qué busca: archivos `.tsx` de `apps/familia/src` (sin tests) que IMPORTAN
     alguna de estas piezas DESDE `@moldes/ui`; en esos, cada `<Pieza …>` tiene
     que nombrar sus props. Qué no busca: una pieza re-exportada por otro
     módulo de la app, o usada sin JSX. `Tag` con `onRemove` es el único caso
     condicional, y se pide siempre: un `removeLabel` de más no rompe nada. */
  const archivos = tsx(SRC);
  const usos: { archivo: string; pieza: string; falta: string[] }[] = [];
  for (const archivo of archivos) {
    const codigo = readFileSync(archivo, 'utf8');
    const delMolde = [...codigo.matchAll(/import\s*\{([^}]*)\}\s*from\s*'@moldes\/ui'/g)]
      .flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+as\s+/).pop()!));
    for (const pieza of Object.keys(PIEZAS).filter((p) => delMolde.includes(p))) {
      for (const m of codigo.matchAll(new RegExp(`<${pieza}\\b([^>]*)>`, 'g'))) {
        usos.push({ archivo, pieza, falta: PIEZAS[pieza].filter((prop) => !new RegExp(`\\b${prop}\\s*=`).test(m[1])) });
      }
    }
  }

  it('EL PISO, PRIMERO: el barrido leyó los .tsx de la app', () => {
    /* 28 medidos el 5/10 (#37). */
    expect(archivos.length, 'no encontró componentes: el glob se rompió').toBeGreaterThanOrEqual(25);
  });

  it(`ningún uso sin su texto (hoy: ${usos.length} usos de piezas del molde)`, () => {
    expect(usos.filter((u) => u.falta.length).map((u) => `${u.archivo.replace(`${SRC}/`, '')}: <${u.pieza}> sin ${u.falta.join(', ')}`)).toEqual([]);
  });

  it('y el barrido sabe ver una que falta (autoexamen)', () => {
    const m = '<Dialog open>'.match(/<Dialog\b([^>]*)>/)!;
    expect(PIEZAS.Dialog.filter((prop) => !new RegExp(`\\b${prop}\\s*=`).test(m[1]))).toEqual(['closeLabel']);
  });
});

describe('§4 · el design.json de Mi espacio', () => {
  it('español neutro: la capa de voseo del molde (es-UY) no se usa, y por eso check:estilo la excusa', () => {
    expect(design.app.espanol).toBe('neutro');
    /* Se compara contra los dos archivos del molde, sin escribir la forma de
       voseo acá: `check:tuteo` la cazaría, y con razón. */
    const neutro = JSON.parse(leer(RAIZ, 'packages', 'moldes', 'idiomas', 'es.json')) as Record<string, string>;
    const capaUy = JSON.parse(leer(RAIZ, 'packages', 'moldes', 'idiomas', 'es-UY.json')) as Record<string, string>;
    expect(capaUy['equipo.tu'], 'la capa es-UY cambia esta clave').not.toBe(neutro['equipo.tu']);
    expect(tDelMolde('es')('equipo.tu')).toBe(neutro['equipo.tu']);
  });

  it('la frase de marca en los tres idiomas', () => {
    expect(design.app.frase).toEqual({ es: 'Entra a tu *espacio*.', en: 'Enter your *space*.', pt: 'Entre no seu *espaço*.' });
  });
});
