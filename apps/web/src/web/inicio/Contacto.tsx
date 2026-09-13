import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';
import { CANALES } from '../comun/canales';
import { Seccion } from '../comun/Seccion';

/** Contacto: la sección tinta que cierra el inicio. */
export function Contacto() {
  const { t } = useTranslation();
  return (
    <Seccion id="contacto" tono="tinta" contenedor={false}>
      <div className="container contacto">
        <div>
          <span className="eyebrow reveal">{t('inicio.contacto.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('inicio.contacto.titulo1')}<br /><span className="suave">{t('inicio.contacto.titulo2')}</span>
          </h2>
        </div>
        <div className="reveal" data-d="2">
          <p className="grande">
            <a href={enlaceWhatsApp(t('comun.mensajes.general'))} target="_blank" rel="noopener">
              {t('inicio.contacto.whatsapp')}
            </a>
          </p>
          <p className="grande u-mt-4">
            <a href={CANALES.youtube} target="_blank" rel="noopener">{t('inicio.contacto.youtube')}</a>
            {' · '}
            <a href={CANALES.spotify} target="_blank" rel="noopener">{t('inicio.contacto.spotify')}</a>
            {' · '}
            <a href={CANALES.facebook} target="_blank" rel="noopener">{t('inicio.contacto.facebook')}</a>
          </p>
          <p className="small u-mt-5">{t('inicio.contacto.base')}</p>
        </div>
      </div>
    </Seccion>
  );
}
