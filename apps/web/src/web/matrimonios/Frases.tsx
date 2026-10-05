import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/**
 * «Frases poderosas para recordar en el camino» (orden #38, 7): las tarjetas
 * de «Lo que te llevas» (`taller/Llevas.tsx`), con cuatro columnas en vez de
 * tres y una foto de esperanza arriba de cada frase, en el orden de la orden.
 *
 * Las fotos van en el 5:4 de «Lo que te llevas» (#20-bis). Las verticales se
 * recortan con `cover`; el encuadre de cada una se decidió mirándola (cuarto
 * valor), no por regla.
 */
export function Frases() {
  const { t } = useTranslation();
  const frases = [
    ['uno', 'esperanza-manos-anillo', 1600, 1067, undefined],
    ['dos', 'esperanza-familia', 1600, 2400, 'encuadre--arriba'],
    ['tres', 'esperanza-abrazo-bn', 1600, 2400, 'encuadre--arriba'],
    ['cuatro', 'esperanza-frente', 1600, 2400, 'encuadre--arriba'],
  ] as const;
  return (
    <Seccion id="frases">
      <h2 className="display-m reveal">{t('matrimonios.frases.titulo')}</h2>
      <div className="tres tres--cuatro reveal" data-d="1">
        {frases.map(([clave, foto, ancho, alto, encuadre]) => (
          <div key={clave}>
            <figure>
              <picture>
                <source
                  type="image/webp"
                  srcSet={`img/fotos/matrimonios/${foto}-900.webp 900w, img/fotos/matrimonios/${foto}-1600.webp 1600w`}
                  sizes="(max-width:900px) 92vw, 23vw"
                />
                <img
                  src={`img/fotos/matrimonios/${foto}-900.webp`}
                  width={ancho}
                  height={alto}
                  alt={t(`matrimonios.frases.${clave}Alt`)}
                  className={encuadre}
                  loading="lazy"
                />
              </picture>
            </figure>
            <p className="frase">{t(`matrimonios.frases.${clave}`)}</p>
          </div>
        ))}
      </div>
    </Seccion>
  );
}
