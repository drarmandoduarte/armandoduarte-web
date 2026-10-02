import { useTranslation } from 'react-i18next';
import { MI_ESPACIO_EN_LA_WEB, TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';
import { enlaceReservarMiLugar } from '../comun/mi-espacio';

/** El cierre: la sección tinta, centrada, con más aire que ninguna. */
export function Reservar() {
  const { t } = useTranslation();
  return (
    <Seccion id="reservar" tono="tinta" clase="cierre">
      <span className="eyebrow reveal">{t('taller.reservar.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">{t('taller.reservar.titulo')}</h2>
      <p className="lead reveal" data-d="2">{t('taller.reservar.lead')}</p>
      <div className="cta-row reveal" data-d="3">
        {MI_ESPACIO_EN_LA_WEB ? (
          <>
            {/* #25: igual que el hero — reservar en la app, WhatsApp en contorno. */}
            <a href={enlaceReservarMiLugar()} className="btn btn--naranja">
              {t('taller.reservar.ctaReservar')} <span className="btn-arrow">→</span>
            </a>
            <BotonWhatsApp
              telefono={TELEFONO_TALLER}
              mensaje={t('comun.mensajes.asegurar')}
              texto={t('taller.reservar.ctaWhatsapp')}
              clase="btn"
            />
          </>
        ) : (
          <>
            {/* #33: como antes de la #25 — WhatsApp en naranja y «Conocer a
                Armando» en contorno. */}
            <BotonWhatsApp
              telefono={TELEFONO_TALLER}
              mensaje={t('comun.mensajes.asegurar')}
              texto={t('comun.reservarPorWhatsApp')}
              clase="btn btn--naranja"
            />
            <a href="/#quien" className="btn">
              {t('taller.reservar.ctaConocer')} <span className="btn-arrow">→</span>
            </a>
          </>
        )}
      </div>
    </Seccion>
  );
}
