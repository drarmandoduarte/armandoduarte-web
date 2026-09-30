import { useTranslation } from 'react-i18next';
import { TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Foto } from '../comun/Foto';
import { Seccion } from '../comun/Seccion';

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
  const llevas = [
    ['01', 'uno', 'llevas-claridad'],
    ['02', 'dos', 'llevas-palabras'],
    ['03', 'tres', 'llevas-serenidad'],
  ] as const;

  return (
    <Seccion id="llevas">
      <span className="eyebrow reveal">{t('taller.llevas.eyebrow')}</span>
      <h2 className="display-m u-mt-4 reveal" data-d="1">{t('taller.llevas.titulo')}</h2>
      <div className="tres reveal" data-d="2">
        {llevas.map(([n, clave, foto]) => (
          <div key={n}>
            <figure>
              <Foto
                nombre={foto}
                alt={t(`taller.llevas.${clave}FotoAlt`)}
                ancho={800}
                alto={1000}
                tamanos="(max-width:900px) 92vw, 30vw"
              />
            </figure>
            <span className="n">{n}</span>
            <h3>{t(`taller.llevas.${clave}Titulo`)}</h3>
            <p>{t(`taller.llevas.${clave}Texto`)}</p>
          </div>
        ))}
      </div>
      <div className="hero-cta reveal" data-d="3">
        <BotonWhatsApp
          telefono={TELEFONO_TALLER}
          mensaje={t('comun.mensajes.programa')}
          texto={t('taller.llevas.cta')}
          clase="btn btn--naranja"
        />
      </div>
    </Seccion>
  );
}
