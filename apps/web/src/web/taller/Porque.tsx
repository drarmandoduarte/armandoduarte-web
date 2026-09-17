import { useTranslation } from 'react-i18next';
import { Foto } from '../comun/Foto';
import { Seccion } from '../comun/Seccion';

/**
 * Por qué las estrategias del pasado ya no funcionan.
 *
 * ── La fotografía (orden #05, D) ─────────────────────────────────────────
 * Lucía la pidió sobre el bloque «Las estrategias del pasado ya no funcionan»,
 * que es éste. La tabla de la orden lo rotulaba «(Suena)» y le daba a esta
 * sección el fondo velado: los rótulos de componente estaban cruzados respecto
 * de los títulos entrecomillados. Manda el título, que es lo que Lucía tenía
 * delante cuando comentó la captura.
 *
 * ── Por qué la sección pasó a dos columnas de verdad ─────────────────────
 * Antes era `grid-2` con el titular a la izquierda y el cuerpo a la derecha:
 * dos columnas de texto. La orden pide la foto «a la izquierda del texto», y con
 * la estructura vieja eso dejaba la foto encima del titular y el cuerpo colgando
 * arriba a la derecha — medido en la previsualización: la columna izquierda
 * quedaba 750 px más alta que la derecha.
 *
 * Así que la sección adopta **el mismo molde que «Quién soy» y «Sobre el
 * facilitador»**: figura a un lado, bloque de texto entero al otro. No es una
 * forma nueva; es la que la casa ya usa dos veces, y es la única lectura en la
 * que «a la izquierda del texto» quiere decir algo. En móvil `grid-2` apila y la
 * foto queda arriba del texto, que es lo otro que la orden pide.
 */
export function Porque() {
  const { t } = useTranslation();
  return (
    <Seccion id="porque" tono="calido" contenedor={false}>
      <div className="container grid-2 centro">
        <figure className="foto-tarjeta reveal">
          <Foto
            nombre="suena-tarjeta"
            alt={t('taller.porque.fotoAlt')}
            ancho={800}
            alto={1000}
            tamanos="(max-width:900px) 92vw, 480px"
          />
        </figure>
        <div>
          <span className="eyebrow reveal">{t('taller.porque.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('taller.porque.titulo1')}<br /><span className="suave">{t('taller.porque.titulo2')}</span>
          </h2>
          <p className="body u-mt-4 reveal" data-d="2">{t('taller.porque.cuerpo1')}</p>
          <p className="body reveal" data-d="2">{t('taller.porque.cuerpo2')}</p>
        </div>
      </div>
    </Seccion>
  );
}
