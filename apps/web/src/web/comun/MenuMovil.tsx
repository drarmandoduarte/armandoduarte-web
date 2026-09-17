import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';

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
 * es lo que el sitio estático tiene y lo que hace que el ancla funcione igual
 * desde `/merida` que desde `/`: el navegador navega y después salta. El
 * guardián de fidelidad compara los `href` en orden, así que acá no se
 * improvisa.
 */
export function MenuMovil({ telefono, mensaje }: { telefono: string; mensaje: string }) {
  const { t } = useTranslation();

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
      <div className="ov__top">
        <button className="ov__close" id="cerrar" aria-label={t('comun.menu.cerrar')}>
          <span>✕</span><span>{t('comun.menu.cerrar')}</span>
        </button>
        <a href="/" className="marca" aria-label={t('comun.marca.aria')}><b>{t('comun.marca.nombre')}</b></a>
        <span className="eyebrow" style={{ opacity: 0.5 }}>{t('comun.marca.sitio')}</span>
      </div>
      <div className="ov__inner">
        <nav aria-label={t('comun.menu.secciones')}>
          <ul className="ov__list">
            {destinos.map(([href, texto]) => (
              <li key={href}><a href={href} data-nav>{texto}</a></li>
            ))}
          </ul>
        </nav>
        <div className="ov__foot">
          <span>{t('comun.marca.sitio')}</span>
          <a className="pr" href={enlaceWhatsApp(telefono, mensaje)} target="_blank" rel="noopener">
            {t('comun.menu.escribir')}
          </a>
        </div>
      </div>
    </div>
  );
}
