import { useTranslation } from 'react-i18next';

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
 */
export function Ahora() {
  const { t } = useTranslation();
  return (
    <section className="ahora" id="ahora" data-ahora="taller-adolescente">
      <div className="container ahora__row reveal">
        <span className="ahora__pill">{t('inicio.ahora.pill')}</span>
        <div>
          <p className="ahora__t">{t('inicio.ahora.titulo')}</p>
          <p className="ahora__meta">
            <span>{t('inicio.ahora.meta1')}</span>
            <span>{t('inicio.ahora.meta2')}</span>
            <span>{t('inicio.ahora.meta3')}</span>
          </p>
        </div>
        <a href="/merida" className="link">{t('inicio.ahora.cta')} <span className="btn-arrow">→</span></a>
      </div>
    </section>
  );
}
