import { useTranslation } from 'react-i18next';
import { enlaceWhatsApp } from '@codice/core';
import { CANALES } from './canales';

/**
 * El pie, idéntico en las cuatro páginas. **Cuatro columnas desde la orden #14**
 * —Explorar, Talleres, Legal, Canales—, la marca arriba con su firma en Great
 * Vibes, y la línea con el punto en el medio.
 *
 * ── Por qué «Talleres» tiene columna propia (orden #14) ───────────────────
 * Los talleres son lo que Armando vende y hasta acá eran **un renglón** perdido
 * en el medio de «Explorar», entre «Qué hago» y «Libros». Un pie con tres
 * columnas y aire de sobra podía decirlo mejor. Sin «próximos talleres», sin
 * «próximamente» — la web no promete un calendario que todavía no existe.
 *
 * Es también donde va a vivir la entrada a «Mi espacio» (PR 4), así que nace
 * ahora para que ese día sea un renglón más y no una columna nueva.
 *
 * ── Y desde la #20 (D) la columna es UN enlace ───────────────────────────
 * «Los talleres: solo el título, no todo», dijo dirección mirando producción.
 * Se fueron la fecha y «Reservar por WhatsApp». La #14 había escrito que la
 * fecha valía su renglón porque «lo que la gente busca en un pie es la fecha»;
 * dirección miró el pie hecho y decidió lo contrario, y entra por D23. Queda
 * escrito porque el argumento de la #14 no era malo: era una hipótesis, y la
 * decidió quien mira la página.
 *
 * `enlaceReservaDelTaller` **sigue existiendo** y se usa en el hero y en
 * `Taller.tsx`: lo que se fue de acá es este enlace, no la función.
 *
 * El `aria-hidden` de la firma es del original y es correcto: «Construyendo
 * familias fuertes» ya está dicho en el `aria-label` de la marca, y un lector
 * de pantalla que lo lea dos veces seguidas suena a error.
 *
 * El `telefono` llega desde `Marco` (orden #05, E). Es lo único que hace que el
 * pie del taller lleve el número de Mérida y el de las otras tres el de Gaby,
 * siendo el mismo componente: el pie no elige, obedece a la página.
 *
 * **El WhatsApp de «Reservar» NO usa ese `telefono`**, y la diferencia importa:
 * ese enlace es del taller en las cuatro páginas, porque quien reserva el taller
 * de Mérida tiene que caer en Mérida aunque esté leyendo el aviso de privacidad.
 * Sale de `enlaceReservaDelTaller`, que desde la #14 es el único lugar donde ese
 * enlace se arma.
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
            <a href="/#libros">{t('comun.nav.libros')}</a>
            <a href="/#programa">{t('comun.nav.programa')}</a>
            <a href="/#contacto">{t('comun.nav.contacto')}</a>
          </div>
          <div className="ft__col">
            <h3>{t('comun.pie.talleres')}</h3>
            {/* Un solo enlace desde la #20 (D): «los talleres: solo el título, no
                todo». Se fueron la fecha y «Reservar por WhatsApp», y con ellos
                sus dos claves de `web.json` — una clave sin uso es deuda. */}
            <a href="/merida">{t('comun.pie.tallerMerida')}</a>
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
            <a href={CANALES.instagram} target="_blank" rel="noopener">{t('comun.pie.instagram')}</a>
            <a className="entero" href={enlaceWhatsApp(telefono, t('comun.mensajes.general'))} target="_blank" rel="noopener">
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
