import { useTranslation } from 'react-i18next';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';

/**
 * El taller, visto desde el inicio: la sección oscura que corta la página.
 * Es la única teal del inicio, y eso es el ritmo de fondos: lo que se quiere
 * que se recuerde va sobre el color que no se repite.
 */
export function Taller() {
  const { t } = useTranslation();
  return (
    <Seccion id="taller" tono="oscuro" contenedor={false}>
      <div className="container grid-2 centro">
        <div>
          <span className="eyebrow reveal">{t('inicio.taller.eyebrow')}</span>
          <h2 className="display-l u-mt-4 reveal" data-d="1">
            {t('inicio.taller.titulo1')}<br />{t('inicio.taller.titulo2')}
          </h2>
          <p className="lead u-mt-4 reveal" data-d="2">{t('inicio.taller.lead')}</p>
          <div className="hero-cta reveal" data-d="3">
            <a href="/taller" className="btn btn--ocre">
              {t('inicio.taller.ctaPrograma')} <span className="btn-arrow">→</span>
            </a>
            <BotonWhatsApp mensaje={t('comun.mensajes.reservar')} texto={t('inicio.taller.ctaWhatsapp')} />
          </div>
        </div>
        <ul className="ficha reveal" data-d="2" style={{ marginTop: 0 }}>
          <li><span>{t('inicio.taller.fichaHorarioClave')}</span><span>{t('inicio.taller.fichaHorarioValor')}</span></li>
          <li><span>{t('inicio.taller.fichaLugarClave')}</span><span>{t('inicio.taller.fichaLugarValor')}</span></li>
          <li><span>{t('inicio.taller.fichaModalidadClave')}</span><span>{t('inicio.taller.fichaModalidadValor')}</span></li>
          <li><span>{t('inicio.taller.fichaInversionClave')}</span><span>{t('inicio.taller.fichaInversionValor')}</span></li>
        </ul>
      </div>
    </Seccion>
  );
}
