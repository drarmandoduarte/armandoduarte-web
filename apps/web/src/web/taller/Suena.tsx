import { useTranslation } from 'react-i18next';
import { Icono } from '../comun/Icono';
import { Seccion } from '../comun/Seccion';

/**
 * La franja de hechos y «¿Te suena?».
 *
 * La franja tiene tres celdas —horario, dónde, modalidad— y no cuatro: el
 * «Cuándo» se eliminó en la orden web #02 porque no hay fecha, y `.hechos` pasó
 * a tres columnas en el mismo cambio. Cuando Armando dé la fecha, vuelve la
 * celda y el CSS vuelve a cuatro.
 *
 * ── La fotografía cambió de lugar (orden #07, decisión 5) ────────────────
 * La #05 la puso de fondo de **toda la sección**, velada al 94 %. A esa
 * opacidad no es una imagen: es una mancha detrás del texto, y el velo tenía
 * que ser así de alto porque encima había ocho bloques de texto chico que
 * necesitaban 4,5:1 cada uno.
 *
 * Ahora es el fondo de **una sola tarjeta**, la de la cita, con velo teal. Ahí
 * el único texto encima es una frase de 30 px en crema, que aguanta mucho menos
 * velo — así que la foto se ve de verdad. La sección vuelve a ser blanca limpia,
 * como el resto.
 *
 * Es el mismo archivo de Lucía; cambió dónde se usa, no cuál.
 */
export function Suena() {
  const { t } = useTranslation();
  const sintomas = [
    ['01', t('taller.suena.unoTitulo'), t('taller.suena.unoTexto')],
    ['02', t('taller.suena.dosTitulo'), t('taller.suena.dosTexto')],
    ['03', t('taller.suena.tresTitulo'), t('taller.suena.tresTexto')],
  ];
  return (
    <Seccion id="suena" tono="blanco">
      <div className="hechos reveal">
        <div>
          <Icono nombre="horario" ancho={40} alto={39} />
          <span>{t('taller.hechos.horarioClave')}</span><b>{t('taller.hechos.horarioValor')}</b>
        </div>
        <div>
          <Icono nombre="lugar" ancho={40} alto={40} />
          <span>{t('taller.hechos.dondeClave')}</span><b>{t('taller.hechos.dondeValor')}</b>
        </div>
        <div>
          <Icono nombre="sesion" ancho={40} alto={40} />
          <span>{t('taller.hechos.modalidadClave')}</span><b>{t('taller.hechos.modalidadValor')}</b>
        </div>
      </div>
      <div className="grid-2 u-mt-8">
        <div>
          <span className="eyebrow reveal">{t('taller.suena.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('taller.suena.titulo1')}<br /><span className="suave">{t('taller.suena.titulo2')}</span>
          </h2>
          <p className="body u-mt-4 reveal" data-d="2">{t('taller.suena.cuerpo')}</p>
        </div>
        <ol className="lista lista--2 reveal" data-d="2" style={{ marginTop: 0 }}>
          {sintomas.map(([n, titulo, texto]) => (
            <li key={n}>
              <span className="n">{n}</span>
              <div><h3>{titulo}</h3><p>{texto}</p></div>
            </li>
          ))}
        </ol>
      </div>
      <blockquote className="bloque-cita bloque-cita--foto u-mt-7 reveal">
        <img
          src="img/fotos/porque-fondo.webp"
          width={1200}
          height={1800}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
        <span>{t('taller.suena.cita')}</span>
      </blockquote>
    </Seccion>
  );
}
