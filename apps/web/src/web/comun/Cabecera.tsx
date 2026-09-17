import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';
import { IconoWhatsApp } from './IconoWhatsApp';
import { MenuMovil } from './MenuMovil';
import type { Pagina } from './cabeza';

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
 * `aria-expanded="false"`. Los `id` (`hd`, `abrir`, `cerrar`, `ov`) son el
 * contrato con el script.
 *
 * ── Por qué el header ya no dice el tagline (orden #06, F) ───────────────
 * Debajo del wordmark iba «CONSTRUYENDO FAMILIAS FUERTES» en naranja de 9 px.
 * A ese tamaño no es una frase, es una textura — y sobre las secciones oscuras
 * directamente desaparecía: el naranja sobre teal no llega ni a 2:1.
 *
 * El tagline no se pierde: sigue en el pie, en Great Vibes y a 30 px, que es
 * donde una firma se lee. `comun.marca.tagline` queda en i18n por eso.
 *
 * Con una sola línea el wordmark se centra verticalmente solo, sin compensar
 * nada a mano: se verifica en el PR que su caja queda a mitad del header.
 */
export function Cabecera({
  pagina,
  telefono,
  mensaje,
}: {
  pagina: Pagina;
  telefono: string;
  mensaje: string;
}) {
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
            </a>
          </div>
          <div className="hd__end">
            <a
              href={enlaceWhatsApp(telefono, mensaje)}
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

      <MenuMovil pagina={pagina} telefono={telefono} mensaje={mensaje} />
    </>
  );
}
