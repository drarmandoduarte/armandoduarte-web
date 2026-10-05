import { useTranslation } from 'react-i18next';
import { CLAVE_MENSAJE_MATRIMONIOS, TELEFONO_MATRIMONIOS_MEXICO } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';

/**
 * El giro (orden #38, 5): «La certeza que transformará tu vida: ¡TODO PROBLEMA
 * TIENE SOLUCIÓN!». Sección clara, `giro-manos` en blanco y negro grande a la
 * izquierda, y a la derecha el título, el párrafo, la frase como cita y el
 * botón principal. Es la bisagra de la página: de acá para abajo, las fotos
 * son de esperanza.
 *
 * El botón es el naranja de esta pantalla (D26): el titular va en tinta, sin
 * acento.
 */
export function Giro() {
  const { t } = useTranslation();
  return (
    <Seccion id="giro" tono="blanco">
      <div className="grid-2 centro giro">
        <figure className="foto-tarjeta giro__foto reveal">
          <picture>
            <source type="image/webp" srcSet="img/fotos/matrimonios/giro-manos-900.webp 900w, img/fotos/matrimonios/giro-manos-1600.webp 1600w" sizes="(max-width:900px) 92vw, 640px" />
            <img src="img/fotos/matrimonios/giro-manos-900.webp" width={900} height={675} alt={t('matrimonios.giro.fotoAlt')} loading="lazy" />
          </picture>
        </figure>
        <div>
          <h2 className="display-m reveal">
            {t('matrimonios.giro.titulo1')}<span className="giro__certeza">{t('matrimonios.giro.titulo2')}</span>
          </h2>
          <p className="body u-mt-4 reveal" data-d="1">{t('matrimonios.giro.cuerpo')}</p>
          <blockquote className="cita u-mt-5 reveal" data-d="2">{t('matrimonios.giro.cita')}</blockquote>
          <div className="hero-cta reveal" data-d="3">
            <BotonWhatsApp
              telefono={TELEFONO_MATRIMONIOS_MEXICO}
              mensaje={t(CLAVE_MENSAJE_MATRIMONIOS)}
              texto={t('matrimonios.reservar')}
              clase="btn btn--naranja"
            />
          </div>
        </div>
      </div>
    </Seccion>
  );
}
