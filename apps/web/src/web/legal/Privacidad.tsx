import { useTranslation } from 'react-i18next';
import { TELEFONO_GABY, enlaceWhatsApp } from '@codice/core';
import { CANALES } from '../comun/canales';
import { Legal } from './Legal';

/**
 * El aviso de privacidad, conforme a la LFPDPPP.
 *
 * Los dos enlaces de contacto abren WhatsApp con el mensaje de derechos ARCO ya
 * escrito. Es lo que la orden web #02 decidió cuando quedó claro que Armando no
 * tiene todavía un correo público: **el único canal que dio**. El día que exista
 * el correo, entra como segundo canal; hasta entonces esto no es un placeholder,
 * es la vía real.
 */
export function Privacidad() {
  const { t } = useTranslation();
  const arco = enlaceWhatsApp(TELEFONO_GABY, t('comun.mensajes.arco'));
  const telefono = t('privacidad.responsableEnlace');

  return (
    <Legal pagina="privacidad" titulo={t('privacidad.titulo')} lead={t('privacidad.lead')}>
      <h2 className="display-s u-mt-7">{t('privacidad.responsableTitulo')}</h2>
      <p className="body u-mt-3">
        {t('privacidad.responsableAntes')}
        <a href={arco} target="_blank" rel="noopener">{telefono}</a>
        {t('privacidad.responsableDespues')}
      </p>

      <h2 className="display-s u-mt-6">{t('privacidad.datosTitulo')}</h2>
      <p className="body u-mt-3">{t('privacidad.datosTexto')}</p>

      <h2 className="display-s u-mt-6">{t('privacidad.usoTitulo')}</h2>
      <p className="body u-mt-3">{t('privacidad.usoTexto')}</p>

      <h2 className="display-s u-mt-6">{t('privacidad.comparteTitulo')}</h2>
      <p className="body u-mt-3">
        {t('privacidad.comparteAntes')}
        <a href={CANALES.politicaWhatsApp} target="_blank" rel="noopener">{t('privacidad.comparteEnlace')}</a>
        {t('privacidad.comparteDespues')}
      </p>

      <h2 className="display-s u-mt-6">{t('privacidad.cookiesTitulo')}</h2>
      <p className="body u-mt-3">{t('privacidad.cookiesTexto')}</p>

      <h2 className="display-s u-mt-6">{t('privacidad.arcoTitulo')}</h2>
      <p className="body u-mt-3">{t('privacidad.arcoTexto')}</p>
      <p className="body u-mt-3">
        {t('privacidad.arcoEjercerAntes')}
        <a href={arco} target="_blank" rel="noopener">{t('privacidad.arcoEjercerEnlace')}</a>
        {t('privacidad.arcoEjercerDespues')}
      </p>

      <h2 className="display-s u-mt-6">{t('privacidad.cambiosTitulo')}</h2>
      <p className="body u-mt-3">{t('privacidad.cambiosTexto')}</p>
    </Legal>
  );
}
