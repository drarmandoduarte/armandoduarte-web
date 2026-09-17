import { useTranslation } from 'react-i18next';
import { Icono } from '../comun/Icono';
import { Seccion } from '../comun/Seccion';

/**
 * Qué hago: tres maneras de trabajar juntos, en lista numerada con hairlines.
 *
 * ── La foto de público NO está de fondo, y es una medición ───────────────
 * La orden #07 (H.2) la pedía acá con el mismo velo del 88 % que llevaba
 * «¿Te suena?». Medido con `check/contraste.mjs`, que promedia el píxel
 * realmente dibujado detrás de cada línea:
 *
 *   velo 88 %  →  14 pares bajo AA (el peor 3,47)
 *   velo 94 %  →  12 pares        (3,98)
 *   velo 96 %  →  10 pares        (4,15)
 *   velo 98 %  →   7 pares        (4,31)
 *
 * No converge. El cuerpo de esta sección es `--gris` a 16 px sobre cálido, que
 * **ya está en 4,51 sin ninguna foto detrás**: no hay margen para que se cuele
 * ni un 2 % de imagen. Y a 98 % la foto ya no se ve, así que el velo que
 * podría llegar a AA es el que la vuelve invisible.
 *
 * Es la misma lección que la decisión 5 de esta orden aplicó a «¿Te suena?»:
 * una foto detrás de texto chico no es una foto, es una mancha. Se sacó, el
 * archivo queda en el repo y la decisión de dónde ponerla —o si va— es de
 * dirección. Está en el informe con estos números.
 */
export function Hago() {
  const { t } = useTranslation();
  const filas = [
    ['01', 'consultoria', t('inicio.hago.unoTitulo'), t('inicio.hago.unoTexto')],
    ['02', 'talleres', t('inicio.hago.dosTitulo'), t('inicio.hago.dosTexto')],
    ['03', 'libros', t('inicio.hago.tresTitulo'), t('inicio.hago.tresTexto')],
  ] as const;
  return (
    <Seccion id="hago" tono="calido">
      <span className="eyebrow reveal">{t('inicio.hago.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">
        {t('inicio.hago.titulo1')}<br /><span className="suave">{t('inicio.hago.titulo2')}</span>
      </h2>
      <ol className="lista reveal" data-d="2">
        {filas.map(([n, icono, titulo, texto]) => (
          <li key={n}>
            <div className="lista__marca">
              <Icono nombre={icono} ancho={40} alto={40} />
              <span className="n">{n}</span>
            </div>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </li>
        ))}
      </ol>
    </Seccion>
  );
}
