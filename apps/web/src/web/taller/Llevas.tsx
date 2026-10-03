import { useTranslation } from 'react-i18next';
import { MI_ESPACIO_EN_LA_WEB, TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Foto } from '../comun/Foto';
import { Seccion } from '../comun/Seccion';
import { enlaceReservarMiLugar } from '../comun/mi-espacio';

/**
 * Lo que te llevas: tres fotos, tres columnas, y el botón.
 *
 * Vivía al pie de `#programa` hasta la #20-bis. Dirección la sacó a su propia
 * sección (#20, A.5) porque las dos juntas medían 1738 px contra una pantalla
 * de 900. El `id` es `llevas` para que el barrido de alturas la mida como una
 * parada de la página; ningún menú apunta acá, y no hace falta.
 */
export function Llevas() {
  const { t } = useTranslation();
  /* El cuarto valor es el encuadre del recorte 5:4 (#20-bis). Sin clase, el
     centro; `claridad` sube al borde de arriba porque centrada le cortaba la
     cabeza al padre. Se decide mirando cada foto, no por regla. */
  const llevas = [
    ['01', 'uno', 'llevas-claridad', 'encuadre--arriba'],
    ['02', 'dos', 'llevas-palabras', undefined],
    ['03', 'tres', 'llevas-serenidad', undefined],
  ] as const;

  return (
    <Seccion id="llevas">
      <span className="eyebrow reveal">{t('taller.llevas.eyebrow')}</span>
      <h2 className="display-m u-mt-4 reveal" data-d="1">{t('taller.llevas.titulo')}</h2>
      <div className="tres reveal" data-d="2">
        {llevas.map(([n, clave, foto, encuadre]) => (
          <div key={n}>
            <figure>
              <Foto
                nombre={foto}
                alt={t(`taller.llevas.${clave}FotoAlt`)}
                ancho={800}
                alto={1000}
                tamanos="(max-width:900px) 92vw, 30vw"
                clase={encuadre}
              />
            </figure>
            <span className="n">{n}</span>
            <h3>{t(`taller.llevas.${clave}Titulo`)}</h3>
            <p>{t(`taller.llevas.${clave}Texto`)}</p>
          </div>
        ))}
      </div>
      <div className="hero-cta reveal" data-d="3">
        {/* Auditoría del #41: reservar en la app, solo el botón principal.
            Sin la app (#33), el WhatsApp con el mensaje del programa, como
            antes de la #25. */}
        {MI_ESPACIO_EN_LA_WEB ? (
          <a href={enlaceReservarMiLugar()} className="btn btn--naranja">
            {t('taller.llevas.cta')} <span className="btn-arrow">→</span>
          </a>
        ) : (
          <BotonWhatsApp
            telefono={TELEFONO_TALLER}
            mensaje={t('comun.mensajes.programa')}
            texto={t('comun.reservarPorWhatsApp')}
            clase="btn btn--naranja"
          />
        )}
      </div>
    </Seccion>
  );
}
