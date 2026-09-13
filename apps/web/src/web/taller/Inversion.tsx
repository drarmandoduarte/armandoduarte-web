import { useTranslation } from 'react-i18next';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';

/**
 * Un solo precio, todo incluido.
 *
 * La cifra lleva `.num`, que es `font-variant-numeric: tabular-nums`: los
 * dígitos de ancho fijo. En un precio grande, sin eso, el 1 deja un hueco.
 */
export function Inversion() {
  const { t } = useTranslation();
  const incluye = [1, 2, 3, 4, 5].map((i) => t(`taller.inversion.incluye${i}`));
  return (
    <Seccion id="inversion" tono="calido">
      <span className="eyebrow reveal">{t('taller.inversion.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">
        {t('taller.inversion.titulo1')}<br /><span className="suave">{t('taller.inversion.titulo2')}</span>
      </h2>
      <div className="plan reveal" data-d="2">
        <div>
          <span className="nombre">{t('taller.inversion.nombre')}</span>
          <div className="precio num">{t('taller.inversion.precio')} <small>{t('taller.inversion.moneda')}</small></div>
          <p className="por">{t('taller.inversion.por')}</p>
          <div className="hero-cta">
            <BotonWhatsApp
              mensaje={t('comun.mensajes.asegurar')}
              texto={t('taller.inversion.cta')}
              clase="btn btn--ocre"
            />
          </div>
        </div>
        <div>
          <ul className="incluye">
            {incluye.map((linea) => <li key={linea}>{linea}</li>)}
          </ul>
          <p className="garantia">
            <b>{t('taller.inversion.garantiaTitulo')}</b>{t('taller.inversion.garantiaTexto')}
          </p>
        </div>
      </div>
    </Seccion>
  );
}
