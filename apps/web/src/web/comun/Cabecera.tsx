import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';
import { IconoWhatsApp } from './IconoWhatsApp';
import { MenuMovil } from './MenuMovil';
import { useTinteDeCabecera } from './useTinteDeCabecera';

/**
 * El header de tres columnas: menú, marca, WhatsApp.
 *
 * Devuelve **dos hermanos** —el `<header>` y el overlay del menú— y no un
 * contenedor con los dos adentro: en el sitio estático son hermanos directos
 * del `<body>`, y el overlay es `position:fixed` con `z-index:60`. Envolverlos
 * en un `<div>` crearía un contexto de apilamiento nuevo y el menú podría
 * quedar por debajo de algo. Es la clase de detalle que no se ve hasta que se
 * ve.
 *
 * El estado de abierto/cerrado vive acá, que es el único lugar donde las dos
 * piezas se tocan.
 */
export function Cabecera({ mensaje }: { mensaje: string }) {
  const { t } = useTranslation();
  const [abierto, setAbierto] = useState(false);
  useTinteDeCabecera();

  return (
    <>
      <header className="hd" id="hd">
        <div className="hd__inner">
          <div className="hd__start">
            <button
              className="hd__menu"
              id="abrir"
              aria-label={t('comun.cabecera.abrirMenu')}
              aria-expanded={abierto}
              aria-controls="ov"
              onClick={() => setAbierto(true)}
            >
              <i /><span>{t('comun.cabecera.menu')}</span>
            </button>
          </div>
          <div className="hd__center">
            <a href="/" className="marca" aria-label={t('comun.marca.ariaInicio')}>
              <b>{t('comun.marca.nombre')}</b>
              <small>{t('comun.marca.tagline')}</small>
            </a>
          </div>
          <div className="hd__end">
            <a
              href={enlaceWhatsApp(mensaje)}
              className="hd__wa"
              target="_blank"
              rel="noopener"
              aria-label={t('comun.cabecera.whatsappAria')}
            >
              <IconoWhatsApp /><span>{t('comun.cabecera.whatsapp')}</span>
            </a>
          </div>
        </div>
      </header>

      <MenuMovil abierto={abierto} onCerrar={() => setAbierto(false)} mensaje={mensaje} />
    </>
  );
}
