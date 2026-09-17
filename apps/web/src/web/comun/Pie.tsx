import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';
import { CANALES } from './canales';

/**
 * El pie, idéntico en las cuatro páginas. Tres columnas —Explorar, Legal,
 * Canales—, la marca arriba con su firma en Great Vibes, y la línea con el
 * punto en el medio.
 *
 * El `aria-hidden` de la firma es del original y es correcto: «Construyendo
 * familias fuertes» ya está dicho en el `aria-label` de la marca, y un lector
 * de pantalla que lo lea dos veces seguidas suena a error.
 *
 * El `telefono` llega desde `Marco` (orden #05, E). Es lo único que hace que el
 * pie del taller lleve el número de Mérida y el de las otras tres el de Gaby,
 * siendo el mismo componente: el pie no elige, obedece a la página.
 */
export function Pie({ telefono, visible }: { telefono: string; visible: string }) {
  const { t } = useTranslation();
  return (
    <footer className="ft" role="contentinfo">
      <div className="container">
        <div className="ft__brand">
          <a href="/" className="marca" aria-label={t('comun.pie.aria')}><b>{t('comun.marca.nombre')}</b></a>
          <span className="script" aria-hidden="true">{t('comun.marca.tagline')}</span>
        </div>
        <div className="ft__rule"><span /></div>
        <div className="ft__grid">
          <div className="ft__col">
            <h3>{t('comun.pie.explorar')}</h3>
            <a href="/#quien">{t('comun.nav.quien')}</a>
            <a href="/#hago">{t('comun.nav.hago')}</a>
            <a href="/merida">{t('comun.nav.taller')}</a>
            <a href="/#libros">{t('comun.nav.libros')}</a>
            <a href="/#programa">{t('comun.nav.programa')}</a>
            <a href="/#contacto">{t('comun.nav.contacto')}</a>
          </div>
          <div className="ft__col">
            <h3>{t('comun.pie.legal')}</h3>
            <a href="/privacidad">{t('comun.pie.privacidad')}</a>
            <a href="/terminos">{t('comun.pie.terminos')}</a>
          </div>
          <div className="ft__col">
            <h3>{t('comun.pie.canales')}</h3>
            <a href={CANALES.youtube} target="_blank" rel="noopener">{t('comun.pie.youtube')}</a>
            <a href={CANALES.spotify} target="_blank" rel="noopener">{t('comun.pie.spotify')}</a>
            <a href={CANALES.facebook} target="_blank" rel="noopener">{t('comun.pie.facebook')}</a>
            <a href={enlaceWhatsApp(telefono, t('comun.mensajes.general'))} target="_blank" rel="noopener">
              {t('comun.pie.whatsapp', { telefono: visible })}
            </a>
          </div>
        </div>
        <div className="ft__bottom">
          <span>{t('comun.pie.copyright')}</span>
          <div className="grupo">
            <a href="/#contacto">{t('comun.pie.contacto')}</a>
            <a href="/privacidad">{t('comun.pie.privacidadCorta')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
