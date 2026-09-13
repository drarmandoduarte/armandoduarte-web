import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';

/**
 * El menú a pantalla completa. Se abre desde el botón del header y se cierra
 * con la ✕, con Escape o al elegir un destino.
 *
 * Los enlaces salen con `/#seccion` —no con el `<Link>` del router— porque eso
 * es lo que el sitio estático tiene y lo que hace que el ancla funcione igual
 * desde `/taller` que desde `/`: el navegador navega y después salta. El
 * guardián de fidelidad compara los `href` en orden, así que acá no se
 * improvisa.
 */
export function MenuMovil({
  abierto,
  onCerrar,
  mensaje,
}: {
  abierto: boolean;
  onCerrar: () => void;
  mensaje: string;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    /* El scroll del fondo se bloquea mientras el menú está abierto, igual que
       en el original (`document.body.style.overflow`). Se limpia al cerrar y al
       desmontar: un overflow que queda puesto deja la página trabada. */
    document.body.style.overflow = abierto ? 'hidden' : '';
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alTeclear);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', alTeclear);
    };
  }, [abierto, onCerrar]);

  const destinos = [
    ['/#quien', t('comun.nav.quien')],
    ['/#hago', t('comun.nav.hago')],
    ['/taller', t('comun.nav.taller')],
    ['/#libros', t('comun.nav.libros')],
    ['/#programa', t('comun.nav.programa')],
    ['/#contacto', t('comun.nav.contacto')],
  ] as const;

  return (
    <div
      className={`ov${abierto ? ' open' : ''}`}
      id="ov"
      role="dialog"
      aria-modal="true"
      aria-label={t('comun.menu.aria')}
    >
      <div className="ov__top">
        <button className="ov__close" id="cerrar" aria-label={t('comun.menu.cerrar')} onClick={onCerrar}>
          <span>✕</span><span>{t('comun.menu.cerrar')}</span>
        </button>
        <a href="/" className="marca" aria-label={t('comun.marca.aria')}><b>{t('comun.marca.nombre')}</b></a>
        <span className="eyebrow" style={{ opacity: 0.5 }}>{t('comun.marca.sitio')}</span>
      </div>
      <div className="ov__inner">
        <nav aria-label={t('comun.menu.secciones')}>
          <ul className="ov__list">
            {destinos.map(([href, texto]) => (
              <li key={href}><a href={href} data-nav onClick={onCerrar}>{texto}</a></li>
            ))}
          </ul>
        </nav>
        <div className="ov__foot">
          <span>{t('comun.marca.sitio')}</span>
          <a className="pr" href={enlaceWhatsApp(mensaje)} target="_blank" rel="noopener">
            {t('comun.menu.escribir')}
          </a>
        </div>
      </div>
    </div>
  );
}
