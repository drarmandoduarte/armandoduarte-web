import { useTranslation } from 'react-i18next';
import { MI_ESPACIO_EN_LA_WEB, TELEFONO_GABY } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { enlaceReservarMiLugar } from '../comun/mi-espacio';
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
            {/* Orden #28: la tarjeta reserva en la app, como el hero de /merida.
                Sobre teal el principal es crema (D26: el naranja es del hero);
                WhatsApp ya está en la cabecera y en /merida. Sin la app (#33),
                el principal vuelve a ser el WhatsApp de Gaby que tenía antes. */}
            {MI_ESPACIO_EN_LA_WEB ? (
              <a href={enlaceReservarMiLugar()} className="btn btn--naranja">
                {t('inicio.taller.cta')} <span className="btn-arrow">→</span>
              </a>
            ) : (
              <BotonWhatsApp
                telefono={TELEFONO_GABY}
                mensaje={t('comun.mensajes.reservar')}
                texto={t('comun.reservarPorWhatsApp')}
                clase="btn btn--naranja"
              />
            )}
            <a href="/merida#programa" className="btn">
              {t('inicio.taller.ctaPrograma')} <span className="btn-arrow">→</span>
            </a>
          </div>
        </div>
        <ul className="ficha reveal" data-d="2">
          <li><span>{t('inicio.taller.fichaFechaClave')}</span><span>{t('inicio.taller.fichaFechaValor')}</span></li>
          <li><span>{t('inicio.taller.fichaHorarioClave')}</span><span>{t('inicio.taller.fichaHorarioValor')}</span></li>
          <li><span>{t('inicio.taller.fichaLugarClave')}</span><span>{t('inicio.taller.fichaLugarValor')}</span></li>
          <li><span>{t('inicio.taller.fichaModalidadClave')}</span><span>{t('inicio.taller.fichaModalidadValor')}</span></li>
          <li><span>{t('inicio.taller.fichaInversionClave')}</span><span>{t('inicio.taller.fichaInversionValor')}</span></li>
        </ul>
      </div>
    </Seccion>
  );
}
