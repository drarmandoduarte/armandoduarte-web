import { useTranslation } from 'react-i18next';
import {
  CLAVE_MENSAJE_MATRIMONIOS,
  MI_ESPACIO_EN_LA_WEB,
  TELEFONO_GABY,
  TELEFONO_MATRIMONIOS_MEXICO,
  enlaceWhatsApp,
} from '@codice/core';
import { enlaceReservarMiLugar } from '../comun/mi-espacio';

/**
 * «Ahora» · lo destacado. Un solo bloque que cambia con lo que Armando
 * necesite: hoy el taller, mañana un curso. El `data-ahora` del original se
 * conserva — es cómo se sabe, mirando el HTML, qué estaba anunciado.
 *
 * ── La fecha, por fin (orden #12, A) ─────────────────────────────────────
 * La #02 quitó de acá el elemento de la fecha en vez de rellenarlo con un
 * «por confirmar»: lo que no está no se inventa. Armando la dio el 28/9, así
 * que las tres celdas pasan a ser lugar, fecha y horario —«Fiesta Inn Mérida ·
 * Jueves 5 de noviembre · 8:30 a 13:00»— y el «Cupo limitado» que ocupaba el
 * lugar de la que faltaba se va: sigue dicho en la ficha del bloque «El taller»
 * y en `/merida`, que es donde alguien lo lee al decidir.
 *
 * ── Dos filas desde la #38 ───────────────────────────────────────────────
 * Mérida y Matrimonios, cada título enlazado a su página y cada fila con su
 * acción a la derecha. Es una sola rejilla de tres columnas y dos filas: la
 * píldora «Ahora» va una vez, arriba a la izquierda, y la segunda fila arranca
 * en la columna de los títulos. `data-ahora` nombra los dos.
 */
export function Ahora() {
  const { t } = useTranslation();
  return (
    <section className="ahora" id="ahora" data-ahora="taller-adolescente taller-matrimonios">
      <div className="container ahora__row reveal">
        <span className="ahora__pill">{t('inicio.ahora.pill')}</span>
        <div>
          {/* Auditoría del #41: el título lleva a `/merida`; la acción de la
              derecha es reservar. */}
          <p className="ahora__t"><a href="/merida">{t('inicio.ahora.titulo')}</a></p>
          <p className="ahora__meta">
            <span>{t('inicio.ahora.meta1')}</span>
            <span>{t('inicio.ahora.meta2')}</span>
            <span>{t('inicio.ahora.meta3')}</span>
          </p>
        </div>
        {/* #25: «Reservar mi lugar» a la app, con el estilo de enlace de la
            banda: el naranja de la portada es el del hero. Sin la app (#33),
            el mismo enlace a WhatsApp que la tarjeta del taller: el número de
            Gaby (el de la portada) y el mensaje de reservar. */}
        {MI_ESPACIO_EN_LA_WEB ? (
          <a href={enlaceReservarMiLugar()} className="link">{t('inicio.ahora.cta')} <span className="btn-arrow">→</span></a>
        ) : (
          <a href={enlaceWhatsApp(TELEFONO_GABY, t('comun.mensajes.reservar'))} className="link" target="_blank" rel="noopener">
            {t('comun.reservarPorWhatsApp')} <span className="btn-arrow">→</span>
          </a>
        )}
        {/* #38: la segunda fila, en la misma rejilla para que los títulos y
            las acciones queden en sus columnas. Reserva siempre por WhatsApp,
            al número de México del taller: este taller no está en Mi espacio. */}
        <div className="ahora__segunda">
          <p className="ahora__t"><a href="/matrimonios">{t('inicio.ahora.matrimonios.titulo')}</a></p>
          <p className="ahora__meta">
            <span>{t('inicio.ahora.matrimonios.meta1')}</span>
            <span>{t('inicio.ahora.matrimonios.meta2')}</span>
            <span>{t('inicio.ahora.matrimonios.meta3')}</span>
          </p>
        </div>
        <a
          href={enlaceWhatsApp(TELEFONO_MATRIMONIOS_MEXICO, t(CLAVE_MENSAJE_MATRIMONIOS))}
          className="link ahora__segunda-accion"
          target="_blank"
          rel="noopener"
        >
          {t('inicio.ahora.matrimonios.cta')} <span className="btn-arrow">→</span>
        </a>
      </div>
    </section>
  );
}
