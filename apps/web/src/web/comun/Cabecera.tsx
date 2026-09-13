import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';
import { IconoWhatsApp } from './IconoWhatsApp';
import { MenuMovil } from './MenuMovil';

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
 * ── Por qué acá no hay estado (orden #02) ─────────────────────────────────
 * Porque esta página **no se hidrata**: React dibuja el HTML una vez, en Node, y
 * después no hay nadie escuchando un `onClick`. Abierto/cerrado es un estado del
 * documento, no del árbol, y lo maneja `comportamiento.ts` poniendo y sacando la
 * clase `open` —exactamente como lo hacía el sitio estático—.
 *
 * Lo que este componente escribe es **el estado de reposo**: el menú cerrado y
 * `aria-expanded="false"`. Que sea el mismo HTML que antes no es una coincidencia
 * feliz: es lo que el guardián de fidelidad mide, y los `id` (`hd`, `abrir`,
 * `cerrar`, `ov`) son el contrato con el script.
 */
export function Cabecera({ mensaje }: { mensaje: string }) {
  const { t } = useTranslation();

  return (
    <>
      <header className="hd" id="hd">
        <div className="hd__inner">
          <div className="hd__start">
            <button
              className="hd__menu"
              id="abrir"
              aria-label={t('comun.cabecera.abrirMenu')}
              aria-expanded="false"
              aria-controls="ov"
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

      <MenuMovil mensaje={mensaje} />
    </>
  );
}
