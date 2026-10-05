import { useTranslation } from 'react-i18next';
import {
  CLAVE_MENSAJE_MATRIMONIOS,
  TELEFONO_MATRIMONIOS_MEXICO,
  TELEFONO_MATRIMONIOS_OTROS_PAISES,
} from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';

/**
 * El cierre «¿Están listos para luchar?» (orden #38, 9), en terracota con
 * `esperanza-abrazo-flores` de fondo bajo un velo terracota medido.
 *
 * Arriba, en dos columnas: el título y el párrafo | la ficha y «Incluye:».
 * Abajo, centrado: el llamado, los dos botones y los dos números escritos.
 * Así, apilado en el teléfono, el orden es el de la orden.
 *
 * Los dos botones abren WhatsApp con el mismo mensaje: el principal (crema
 * sobre terracota) al número de México, «Desde otro país» en contorno al otro.
 * Los números van además como texto, para quien los quiera copiar.
 */
export function Cierre() {
  const { t } = useTranslation();
  const ficha = ['modalidad', 'duracion', 'inicia', 'inversion'] as const;
  const incluye = [1, 2, 3, 4].map((i) => t(`matrimonios.cierre.incluye${i}`));
  const mensaje = t(CLAVE_MENSAJE_MATRIMONIOS);
  return (
    <Seccion id="reservar" tono="terracota" clase="cierre-matrimonios con-fondo" contenedor={false}>
      <div className="fondo-foto fondo-foto--flores">
        <picture>
          <source type="image/webp" media="(min-width: 1101px)" srcSet="img/fotos/matrimonios/esperanza-abrazo-flores-2400.webp" width={2400} height={1600} />
          <source type="image/webp" media="(min-width: 601px)" srcSet="img/fotos/matrimonios/esperanza-abrazo-flores-1600.webp" width={1600} height={1067} />
          <img
            src="img/fotos/matrimonios/esperanza-abrazo-flores-900.webp"
            width={900}
            height={600}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </picture>
      </div>

      <div className="container">
        <div className="grid-2">
          <div>
            <h2 className="display-l reveal">{t('matrimonios.cierre.titulo')}</h2>
            <p className="body u-mt-4 reveal" data-d="1">{t('matrimonios.cierre.cuerpo')}</p>
          </div>
          <div>
            <ul className="ficha ficha--cierre reveal" data-d="1">
              {ficha.map((clave) => (
                <li key={clave}>
                  <span>{t(`matrimonios.cierre.${clave}Clave`)}</span><span>{t(`matrimonios.cierre.${clave}Valor`)}</span>
                </li>
              ))}
            </ul>
            <p className="incluye__clave reveal" data-d="2">{t('matrimonios.cierre.incluyeClave')}</p>
            <ul className="incluye reveal" data-d="2">
              {incluye.map((linea) => <li key={linea}>{linea}</li>)}
            </ul>
          </div>
        </div>

        <div className="cierre-matrimonios__accion">
          <p className="llamado reveal">{t('matrimonios.cierre.llamado')}</p>
          <div className="cta-row reveal" data-d="1">
            <BotonWhatsApp
              telefono={TELEFONO_MATRIMONIOS_MEXICO}
              mensaje={mensaje}
              texto={t('matrimonios.reservar')}
              clase="btn btn--naranja"
            />
            <BotonWhatsApp
              telefono={TELEFONO_MATRIMONIOS_OTROS_PAISES}
              mensaje={mensaje}
              texto={t('matrimonios.otroPais')}
              clase="btn"
            />
          </div>
          <p className="telefonos reveal" data-d="2">{t('matrimonios.cierre.telefonos')}</p>
        </div>
      </div>
    </Seccion>
  );
}
