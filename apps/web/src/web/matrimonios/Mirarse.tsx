import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/**
 * «¿Hace cuánto tiempo dejaron de mirarse con ilusión?» — el molde de «¿Te
 * suena?» de `/merida` (orden #38, 3): la foto de fondo de toda la sección
 * bajo un velo crema, el título y la bajada a la izquierda, las cinco
 * preguntas numeradas a la derecha, y la cita en la tarjeta translúcida a todo
 * el ancho.
 *
 * La foto es `dolor-cama` (la pareja de espaldas en la cama, `5.jpg` de
 * Armando). El velo no se eligió: se midió con `check/contraste.mjs` sobre el
 * píxel pintado, y el número está en `index.css` al lado de la regla.
 *
 * `con-fondo` es lo que hace que el barrido de contraste mida la foto y no el
 * blanco de la sección (ver `taller/Suena.tsx`). Sin rótulo: Armando no
 * escribió uno, y lo que Armando no escribió no se pone.
 */
export function Mirarse() {
  const { t } = useTranslation();
  const preguntas = ['uno', 'dos', 'tres', 'cuatro', 'cinco'] as const;
  return (
    <Seccion id="mirarse" tono="blanco" clase="suena-fondo mirarse-fondo con-fondo" contenedor={false}>
      {/* Tres tamaños por `<source media>`, como en «¿Te suena?» (#14 D): con
          `srcset`/`sizes` un teléfono 3× se llevaría la grande. */}
      <div className="fondo-foto fondo-foto--cama">
        <picture>
          <source type="image/webp" media="(min-width: 1101px)" srcSet="img/fotos/matrimonios/dolor-cama-2400.webp" width={2400} height={1350} />
          <source type="image/webp" media="(min-width: 601px)" srcSet="img/fotos/matrimonios/dolor-cama-1600.webp" width={1600} height={900} />
          <img
            src="img/fotos/matrimonios/dolor-cama-900.webp"
            width={900}
            height={506}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </picture>
      </div>

      <div className="container">
        <div className="grid-2">
          <div>
            <h2 className="display-m reveal">{t('matrimonios.mirarse.titulo')}</h2>
            <p className="body u-mt-4 reveal" data-d="1">{t('matrimonios.mirarse.bajada')}</p>
          </div>
          <ol className="lista lista--2 lista--preguntas reveal" data-d="2">
            {preguntas.map((clave, i) => (
              <li key={clave}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <div><p className="pregunta">{t(`matrimonios.mirarse.${clave}`)}</p></div>
              </li>
            ))}
          </ol>
        </div>

        <blockquote className="bloque-cita bloque-cita--ancha u-mt-7 reveal">
          {t('matrimonios.mirarse.cita')}
        </blockquote>
      </div>
    </Seccion>
  );
}
