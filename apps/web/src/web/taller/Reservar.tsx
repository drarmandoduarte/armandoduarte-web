import { useTranslation } from 'react-i18next';
import { TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';

/** El cierre: la sección tinta, centrada, con más aire que ninguna. */
export function Reservar() {
  const { t } = useTranslation();
  return (
    <Seccion id="reservar" tono="tinta" clase="cierre">
      <span className="eyebrow reveal">{t('taller.reservar.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">{t('taller.reservar.titulo')}</h2>
      <p className="lead reveal" data-d="2">{t('taller.reservar.lead')}</p>
      <div className="cta-row reveal" data-d="3">
        <BotonWhatsApp
          telefono={TELEFONO_TALLER}
          mensaje={t('comun.mensajes.asegurar')}
          texto={t('taller.reservar.ctaAsegurar')}
          clase="btn btn--naranja"
        />
        <a href="/#quien" className="btn">
          {t('taller.reservar.ctaConocer')} <span className="btn-arrow">→</span>
        </a>
      </div>
    </Seccion>
  );
}
