#!/usr/bin/env node
/**
 * Guardián de la voz de la interfaz: **tuteo neutro**, nunca voseo.
 *
 * Heredado de Omnia (que lo heredó de Bitácora) con una diferencia que importa,
 * escrita abajo. Corre con `pnpm check:tuteo` y falla si aparece voseo en el
 * código o en los textos de `core`.
 *
 * ── La regla de los dos registros (D6) ─────────────────────────────────────
 * La app y la web hablan **español neutro, tuteo**: «puedes», «tienes»,
 * «escríbenos». El **voseo es del doctor** —«mirá», «tenés»— y vive en un solo
 * lugar del monorepo, `packages/prompts`, que es por donde el asistente escribe
 * como escribe él. Por eso ese paquete queda fuera de este barrido: lo cuida
 * `check-estilo.mjs`, que mira lo simétrico.
 *
 * ── Lo que esta casa SACÓ de la lista de Omnia, y por qué ─────────────────
 * **«acá».** En Omnia es un regionalismo rioplatense y está prohibido. Acá no:
 * el sitio es `es-MX` y Armando escribe en español de México, donde «acá» es
 * corriente y no tiene nada de voseo. La lista de Omnia lo mezclaba con «vos»
 * bajo el rótulo «regionalismo», y esa mezcla es de allá.
 *
 * No es teórico: `terminos.html` dice **«la información que encuentras acá es
 * orientativa»**, escrito por la casa para Armando y aprobado. Con la lista de
 * Omnia tal cual, el port de ese texto pone la gate en rojo y la única salida
 * sería **cambiar una palabra de un texto legal publicado** — que es
 * exactamente lo que la orden #01 prohíbe. Un guardián que obliga a mentirle al
 * usuario para ponerse verde está mal calibrado, no el texto.
 *
 * **«vos» se queda**, y con él las ~180 formas verbales. Eso es lo que el guard
 * vino a cazar.
 *
 * ── Y sigue siendo un denylist, no un detector morfológico ────────────────
 * No se puede vetar «-á/-é/-í» en general: choca con formas legítimas del
 * neutro («está», «aquí», «café», «guardé» de primera persona, los futuros
 * «-rá»/«-ré»). Cuando aparezca una forma nueva, se agrega acá. Regla práctica:
 * imperativo voseo = -ar→«-á», -er→«-é», -ir→«-í».
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ── Las carpetas, y la de la #15 ─────────────────────────────────────────
   `apps/familia/src` entra con Mi espacio (orden #15, A): sus textos salen de
   `referencia-cenit`, que está escrita en voseo rioplatense —«Escribí»,
   «ignorá»—, y la orden dice que se reescriben y no se copian. Este guardián es
   el que decide si se reescribieron de verdad.

   `apps/api/src` también, aunque hoy casi no tenga texto: los mensajes de error
   de la API los lee una persona, y un «no podés» que se escapa en un `throw` se
   ve en la pantalla igual que uno de un componente. */
const CARPETAS = [
  'apps/web/src',
  'apps/familia/src',
  'apps/api/src',
  'packages/core/src',
  'packages/ui/components',
];
const EXTENSIONES = ['.ts', '.tsx', '.js', '.jsx', '.json'];
/* Solo se audita el castellano. Cuando entren en/pt (D13), sus carpetas quedan
   fuera: en francés «vos» es «tus», y en portugués «está» no es lo mismo. */
/**
 * Lo que este barrido NO mira, con su motivo.
 *
 * ── Los otros idiomas ──────────────────────────────────────────────────
 * `en/` y `pt/` no son español y el patrón daría falsos positivos.
 *
 * ── Y el núcleo del Kit de Acceso (orden #15; renombrado en la #37) ──────
 * `acceso/nucleo/` **no es de esta app**: viaja del kit byte por byte,
 * con su SHA-256 en `HUELLAS.txt`, y `guardian/check.mjs` se
 * pone rojo si alguien lo edita acá adentro. Las dos reglas chocaban de frente
 * —«la interfaz habla tuteo» contra «el núcleo no se toca»— y **el kit manda**:
 * está escrito así en su `LEEME.md` y en la orden de la noche.
 *
 * Lo que el barrido encontró antes de que esta línea existiera, y que NO se
 * puede arreglar desde este repo, queda dicho acá para que no se pierda:
 *
 *   · `nucleo/aal2.guard.ts:147` — «**Volvé** a ingresar el código de tu
 *     autenticador para hacer esto.» Éste **lo lee una persona**: es el
 *     `message` del 403 con código `PASO_RECIENTE_REQUERIDO`. En una app
 *     mexicana está mal escrito.
 *   · `nucleo/sin-segundo-paso.decorator.ts:28` — «**escribí** por qué esta
 *     ruta no puede pedir 2FA». Éste lo lee quien programa, no un cliente: es
 *     el `Error` que tira el decorador si alguien lo usa sin razón.
 *
 * El primero se arregla **en el kit** (sube `VERSION`, se regeneran las huellas,
 * sale un kit nuevo para todas las apps), y eso lo decide Dirección de 512, no
 * este repo. Mientras tanto la app no lo muestra: `apps/familia` traduce los
 * **códigos** de error del kit a sus propios textos y nunca pinta el `message`
 * que viene del servidor. Anotado en el informe de la #15.
 */
const FUERA = ['/i18n/en/', '/i18n/pt/', '/acceso/nucleo/'];

const VOSEO = [
  'tenés', 'podés', 'querés', 'sabés', 'ponés', 'aceptás', 'cargás',
  'declarás', 'ejercés', 'hacés', 'venís',
  'hacé', 'subí', 'cargá', 'arrastrá', 'elegí', 'contame', 'contanos',
  'separá', 'escribí', 'escribinos', 'escribime', 'completá', 'seleccioná',
  'ingresá', 'guardá', 'configurá', 'activá', 'revisá', 'intentá', 'probá',
  'mirá', 'fijate', 'acordate', 'elegila', 'elegilo', 'poné', 'usá', 'volvé',
  'verificá', 'mostrá', 'dejá', 'agregá', 'enviá', 'mandá', 'buscá', 'pedí',
  'decí', 'abrí', 'cerrá', 'empezá', 'seguí', 'quitá', 'deslizá', 'avisá',
  'esperá', 'vení', 'salí', 'hacelo', 'hacela',
  'armá', 'armás', 'editás', 'elegís', 'borrés', 'borrá', 'asigná',
  'asignás', 'reconectá', 'enfocate', 'olvidás', 'guardalos', 'registrás',
  'seguís', 'dale', 'sumá', 'conectá', 'generá', 'abrila',
  'recargá', 'recargalo', 'recargala',
  'imprimí', 'adaptá', 'anotá', 'cambiá', 'creá', 'escondé', 'evitá',
  'gestioná', 'indicá', 'logueá', 'marcá', 'mejorá', 'mové', 'pasá',
  'planificá', 'programá', 'refrescá', 'reintentá', 'tachá', 'visitá',
  'usalo', 'usala', 'usalos', 'usalas', 'traete', 'traé', 'dejalo', 'dejala',
  'ponelo', 'ponela', 'sacalo', 'sacala', 'mandalo', 'mandanos', 'avisanos',
  'avisame', 'contámelo', 'quedate', 'sentate',
  'descargá', 'adjuntá', 'actualizá', 'confirmá', 'cancelá', 'rechazá',
  'aceptá', 'asegurá', 'copiá', 'pegá', 'filtrá', 'ordená', 'exportá',
  'importá', 'sincronizá', 'vinculá', 'desvinculá', 'duplicá', 'renombrá',
  'archivá', 'restaurá', 'recuperá', 'reenviá', 'reprogramá', 'agendá',
  'pagá', 'cobrá', 'facturá', 'calificá', 'analizá', 'redactá', 'firmá',
  'compartí', 'invitá', 'notificá', 'recordá', 'documentá', 'validá',
  'corregí', 'aprobá', 'publicá', 'ocultá', 'recortá', 'ampliá', 'reducí',
  'continuá', 'finalizá', 'terminá', 'pausá', 'reanudá', 'apretá', 'cliqueá',
  'habilitá', 'deshabilitá', 'bloqueá', 'desbloqueá', 'desactivá',
  // El pronombre. Es el que define el registro, y se veta como palabra entera.
  'vos',
];

/* Lookarounds en vez de \b: las palabras terminan en vocal acentuada y el \b
   de JavaScript no las trata como carácter de palabra. */
const LETRA = 'A-Za-zÁÉÍÓÚáéíóúÑñ';
const PATRON = new RegExp(`(?<![${LETRA}])(${VOSEO.join('|')})(?![${LETRA}])`, 'iu');

function recorrer(dir) {
  const out = [];
  let entradas;
  try { entradas = readdirSync(dir); } catch { return out; }
  for (const entrada of entradas) {
    const full = join(dir, entrada);
    if (statSync(full).isDirectory()) out.push(...recorrer(full));
    else if (EXTENSIONES.some((ext) => full.endsWith(ext))) out.push(full);
  }
  return out;
}

const hallazgos = [];
let archivos = 0;
for (const rel of CARPETAS) {
  for (const archivo of recorrer(join(RAIZ, rel))) {
    if (FUERA.some((p) => archivo.includes(p))) continue;
    archivos += 1;
    readFileSync(archivo, 'utf8').split('\n').forEach((linea, i) => {
      const m = linea.match(PATRON);
      if (m) hallazgos.push(`${archivo.slice(RAIZ.length + 1)}:${i + 1}  ${m[1]}  ->  ${linea.trim().slice(0, 110)}`);
    });
  }
}

/* El piso, que es el corolario de siempre: un cero sobre cero archivos leídos
   se ve idéntico a un cero sobre una casa limpia. Si mañana alguien renombra
   `apps/web/src`, este guardián tiene que gritar, no felicitar. */
if (archivos < 5) {
  process.stderr.write(
    `check-tuteo: el barrido leyó ${archivos} archivo(s) en [${CARPETAS.join(', ')}] y eso no alcanza `
    + 'para afirmar nada. O las carpetas se movieron, o las extensiones cambiaron.\n',
  );
  process.exit(1);
}

if (hallazgos.length) {
  process.stderr.write(
    `Voseo detectado (${hallazgos.length}). La interfaz habla tuteo neutro; el voseo del doctor vive en `
    + 'packages/prompts.\nConvertí cada forma: tenés->tienes, podés->puedes, elegí->elige.\n\n',
  );
  for (const h of hallazgos) process.stderr.write(`  ${h}\n`);
  process.exit(1);
}

process.stdout.write(`check-tuteo: sin voseo en ${archivos} archivos de la interfaz.\n`);
