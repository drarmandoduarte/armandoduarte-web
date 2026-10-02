import { useTranslation } from 'react-i18next';
import { MI_ESPACIO_EN_LA_WEB, TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';
import { enlaceReservarMiLugar } from '../comun/mi-espacio';

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
            {MI_ESPACIO_EN_LA_WEB ? (
              <>
                {/* Auditoría del #41: donde está el precio, igual que el hero —
                    reservar en la app (naranja) y WhatsApp en contorno. */}
                <a href={enlaceReservarMiLugar()} className="btn btn--naranja">
                  {t('taller.inversion.cta')} <span className="btn-arrow">→</span>
                </a>
                <BotonWhatsApp
                  telefono={TELEFONO_TALLER}
                  mensaje={t('comun.mensajes.asegurar')}
                  texto={t('taller.inversion.ctaWhatsapp')}
                  clase="btn"
                />
              </>
            ) : (
              /* #33: sin la app, un solo botón, como antes de la #25. */
              <BotonWhatsApp
                telefono={TELEFONO_TALLER}
                mensaje={t('comun.mensajes.asegurar')}
                texto={t('comun.reservarPorWhatsApp')}
                clase="btn btn--naranja"
              />
            )}
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
