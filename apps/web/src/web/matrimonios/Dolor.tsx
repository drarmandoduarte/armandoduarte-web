import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/**
 * «El dolor de un matrimonio herido no tiene por qué ser el final» (orden
 * #38, 4): dos filas de foto y texto, alternadas, con el molde de «Por qué» de
 * `/merida` (figura a un lado, el bloque de texto entero al otro).
 *
 *   · arriba, `dolor-llanto` a la izquierda y el título con el primer párrafo;
 *   · abajo, el párrafo de los hijos y «Tu pareja no es el rival…» a la
 *     izquierda, y `dolor-hijo` a la derecha.
 *
 * La orden dice «los dos primeros párrafos» arriba y «el párrafo de los hijos y
 * “Tu pareja…”» abajo, pero el `.docx` trae **tres** párrafos y el de los hijos
 * es el segundo. Se leyó como: arriba el título y el primero; abajo el segundo
 * y el tercero. Está declarado en el informe.
 *
 * La negrita del segundo párrafo es la de Armando en el `.docx`. Cierra la
 * cita «No están solos…» con el estilo de cita de la casa.
 */
export function Dolor() {
  const { t } = useTranslation();
  return (
    <Seccion id="dolor" tono="calido">
      <div className="grid-2 centro dolor__fila">
        <figure className="foto-tarjeta dolor__foto reveal">
          <picture>
            <source type="image/webp" srcSet="img/fotos/matrimonios/dolor-llanto-900.webp 900w, img/fotos/matrimonios/dolor-llanto-1600.webp 1600w" sizes="(max-width:900px) 92vw, 620px" />
            <img src="img/fotos/matrimonios/dolor-llanto-900.webp" width={900} height={600} alt={t('matrimonios.dolor.llantoAlt')} loading="lazy" />
          </picture>
        </figure>
        <div>
          <h2 className="display-m reveal">{t('matrimonios.dolor.titulo')}</h2>
          <p className="body u-mt-4 reveal" data-d="1">{t('matrimonios.dolor.cuerpo1')}</p>
        </div>
      </div>

      <div className="grid-2 centro dolor__fila dolor__fila--alternada">
        <div>
          <p className="body reveal">{t('matrimonios.dolor.hijos')}<b>{t('matrimonios.dolor.hijosFuerte')}</b></p>
          <p className="body reveal" data-d="1">{t('matrimonios.dolor.rival')}</p>
        </div>
        <figure className="foto-tarjeta dolor__foto dolor__foto--vertical reveal">
          <picture>
            <source type="image/webp" srcSet="img/fotos/matrimonios/dolor-hijo-900.webp 900w, img/fotos/matrimonios/dolor-hijo-1600.webp 1600w" sizes="(max-width:900px) 92vw, 480px" />
            <img src="img/fotos/matrimonios/dolor-hijo-900.webp" width={900} height={1350} alt={t('matrimonios.dolor.hijoAlt')} loading="lazy" />
          </picture>
        </figure>
      </div>

      <blockquote className="cita cita--ancha u-mt-7 reveal">{t('matrimonios.dolor.cita')}</blockquote>
    </Seccion>
  );
}
