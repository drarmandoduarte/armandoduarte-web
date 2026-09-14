import { useTranslation } from 'react-i18next';

/**
 * «Ahora» · lo destacado. Un solo bloque que cambia con lo que Armando
 * necesite: hoy el taller, mañana un curso. El `data-ahora` del original se
 * conserva — es cómo se sabe, mirando el HTML, qué estaba anunciado.
 *
 * No dice fecha porque Armando todavía no la dio, y la orden web #02 decidió
 * que lo que no está no se rellena: se elimina el elemento.
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
        <a href="/taller" className="link">{t('inicio.ahora.cta')} <span className="btn-arrow">→</span></a>
      </div>
    </section>
  );
}
