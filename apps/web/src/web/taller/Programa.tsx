import { useTranslation } from 'react-i18next';
import { TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Foto } from '../comun/Foto';
import { Icono } from '../comun/Icono';
import { Seccion } from '../comun/Seccion';

/**
 * Los cinco núcleos y lo que te llevas.
 *
 * Los pasos llevan una línea entre el número y el siguiente, que se apaga en el
 * último (`.paso:last-child .paso__line`) y en pantallas de menos de 1100px. El
 * `<span class="paso__line">` va igual en los cinco: quién se ve y quién no lo
 * decide el CSS, no el marcado.
 *
 * ── De cuatro a cinco, y de dos párrafos a uno (orden #12, G) ────────────
 * Armando mandó el 28/9 el modelo entero —«Modelo orientado a la madurez»— con
 * **una línea por núcleo**. Los dos párrafos de antes eran de la #01 y estaban
 * escritos por la casa; el segundo de cada núcleo no tiene equivalente en lo
 * que Armando escribió, y **lo que Armando no escribió no se pone**. Así que la
 * clave pasa de `texto1`/`texto2` a un solo `texto`, que es lo que hay.
 */
export function Programa() {
  const { t } = useTranslation();
  /* El cuarto valor es el ícono. Los cuatro primeros son los PNG de Lucía; el
     quinto, `cambios.svg`, llegó con los insumos de la #12 en el mismo estilo y
     en el mismo naranja. El orden es el que fijó la orden #12, G, y ya no es el
     que Lucía marcó sobre la captura de la #05: los núcleos son otros. */
  const nucleos = [
    ['01', '1', 'uno', 'cerebro'],
    ['02', '2', 'dos', 'emociones'],
    ['03', '3', 'tres', 'comunicacion'],
    ['04', '3', 'cuatro', 'victorias'],
    ['05', '3', 'cinco', 'cambios'],
  ] as const;

  const llevas = [
    ['01', 'uno', 'llevas-claridad'],
    ['02', 'dos', 'llevas-palabras'],
    ['03', 'tres', 'llevas-serenidad'],
  ] as const;

  return (
    <Seccion id="programa">
      <span className="eyebrow reveal">{t('taller.programa.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">
        {t('taller.programa.titulo1')}<br /><span className="suave">{t('taller.programa.titulo2')}</span>
      </h2>
      <div className="pasos">
        {nucleos.map(([n, demora, clave, icono]) => (
          <div className="paso reveal" data-d={demora} key={n}>
            <div className="paso__head">
              <span className="paso__num">{n}</span>
              <Icono nombre={icono} ancho={48} alto={48} clase="paso__icono" />
              <span className="paso__line" />
            </div>
            <h3><b>{t(`taller.programa.${clave}.rotulo`)}</b>{t(`taller.programa.${clave}.titulo`)}</h3>
            <p>{t(`taller.programa.${clave}.texto`)}</p>
          </div>
        ))}
      </div>
      <p className="receso reveal">{t('taller.programa.receso')}</p>

      <div className="u-mt-8">
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
      </div>
    </Seccion>
  );
}
