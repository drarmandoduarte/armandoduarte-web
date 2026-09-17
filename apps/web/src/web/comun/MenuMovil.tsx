import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';
import { IconoCerrar } from './IconoCerrar';
import type { Pagina } from './cabeza';

/**
 * El menú a pantalla completa, en su estado de reposo: cerrado.
 *
 * Abrirlo y cerrarlo —la clase `open`, el `aria-expanded` del botón y el
 * `overflow` del `<body>`— es trabajo de `comportamiento.ts` desde la orden #02,
 * porque esta página no se hidrata y acá no hay nadie escuchando. Lo que este
 * componente aporta son el marcado, los textos y los `id` con los que el script
 * lo encuentra: `ov`, `cerrar` y los `[data-nav]`.
 *
 * Los enlaces salen con `/#seccion` —no con el `<Link>` del router— porque eso
 * es lo que el sitio estático tenía y lo que hace que el ancla funcione igual
 * desde `/merida` que desde `/`: el navegador navega y después salta.
 *
 * ── Lo que cambió en la #06, y por qué ───────────────────────────────────
 * La barra de arriba tenía **tres** cosas: «✕ CERRAR», la marca centrada y
 * `ARMANDODUARTE.COM` en ámbar al 50 %. A 375 px las tres se pisaban —se leía
 * «CERRARARMANDO DUARTEARMANDOD…» cortado por el borde— y el sitio aparecía dos
 * veces, porque el pie del menú también lo decía.
 *
 * Ahora hay **una sola**: cerrar. No es una regla de responsive que tapa el
 * choque, es que el choque no existe. La marca no hace falta —el overlay se abre
 * desde una página que ya la tiene— y el sitio lo reemplaza el lugar, abajo.
 *
 * El pie pasa a tres zonas como el motor de 512: el lugar, el hueco del idioma
 * y el contacto, **todo en el mismo tono**. El del medio va vacío y con
 * `aria-hidden` a propósito: cuando entren EN y PT (D13) ahí va el selector, y
 * dejándolo puesto la izquierda y la derecha ya quedan donde van a quedar.
 */
export function MenuMovil({
  pagina,
  telefono,
  mensaje,
}: {
  pagina: Pagina;
  telefono: string;
  mensaje: string;
}) {
  const { t } = useTranslation();

  /*
   * El ítem de la página en la que uno está, en ámbar (orden #06, B).
   *
   * Solo puede haber uno y solo puede ser `/merida`: los otros cinco destinos
   * son anclas de la portada, no páginas. Marcar «Quién soy» como activo estando
   * en la portada sería mentir —no es donde uno está, es a dónde va a saltar— y
   * las dos legales no están en el menú.
   */
  const activo = (href: string) => (pagina === 'taller' && href === '/merida' ? 'activo' : undefined);

  const destinos = [
    ['/#quien', t('comun.nav.quien')],
    ['/#hago', t('comun.nav.hago')],
    ['/merida', t('comun.nav.taller')],
    ['/#libros', t('comun.nav.libros')],
    ['/#programa', t('comun.nav.programa')],
    ['/#contacto', t('comun.nav.contacto')],
  ] as const;

  return (
    <div
      className="ov"
      id="ov"
      role="dialog"
      aria-modal="true"
      aria-label={t('comun.menu.aria')}
    >
      <button className="ov__close" id="cerrar" aria-label={t('comun.menu.cerrar')}>
        <IconoCerrar /><span>{t('comun.menu.cerrar')}</span>
      </button>
      <div className="ov__inner">
        <nav aria-label={t('comun.menu.secciones')}>
          <ul className="ov__list">
            {destinos.map(([href, texto]) => (
              <li key={href}>
                <a href={href} className={activo(href)} aria-current={activo(href) && 'page'} data-nav>
                  {texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ov__foot">
          <span>{t('comun.menu.lugar')}</span>
          {/* El hueco del selector de idioma (D13). Ver la cabecera del archivo. */}
          <span aria-hidden="true" />
          <a href={enlaceWhatsApp(telefono, mensaje)} target="_blank" rel="noopener">
            {t('comun.menu.escribir')}
          </a>
        </div>
      </div>
    </div>
  );
}
