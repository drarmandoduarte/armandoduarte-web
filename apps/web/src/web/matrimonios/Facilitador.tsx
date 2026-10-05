import { useTranslation } from 'react-i18next';
import { Retrato } from '../comun/Retrato';
import { Seccion } from '../comun/Seccion';

/**
 * «Sobre el facilitador» (orden #38, 8), en terracota: el de `/merida`
 * —Armando de pie, con las reglas de alineación de la #26 y la #28, que cuelgan
 * del `id="facilitador"`— con la **biografía nueva** del `.docx`, literal, y
 * la cita para matrimonios.
 *
 * La ficha es la misma de `/merida`, y por eso lee sus claves de
 * `taller.facilitador.*`: Familia, Práctica, Formación y Libros publicados con
 * los tres de la #36. Una ficha copiada en `matrimonios.*` sería la segunda
 * verdad que un día no coincide.
 */
export function Facilitador() {
  const { t } = useTranslation();
  return (
    <Seccion id="facilitador" tono="terracota" contenedor={false}>
      <div className="container grid-2 centro">
        <figure className="foto foto--libre reveal">
          <Retrato cual="de-pie" alt={t('matrimonios.facilitador.fotoAlt')} tamanos="(max-width:900px) 92vw, 472px" />
        </figure>
        <div>
          <span className="eyebrow reveal">{t('matrimonios.facilitador.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('matrimonios.facilitador.titulo1')}<br /><span className="suave">{t('matrimonios.facilitador.titulo2')}</span>
          </h2>
          <p className="body u-mt-4 reveal" data-d="2">
            <b>{t('matrimonios.facilitador.bioNombre')}</b>{t('matrimonios.facilitador.bio')}
          </p>
          <ul className="ficha reveal" data-d="2">
            <li><span>{t('taller.facilitador.familiaClave')}</span><span>{t('taller.facilitador.familiaValor')}</span></li>
            <li><span>{t('taller.facilitador.practicaClave')}</span><span>{t('taller.facilitador.practicaValor')}</span></li>
            <li><span>{t('taller.facilitador.formacionClave')}</span><span>{t('taller.facilitador.formacionValor')}</span></li>
            <li><span>{t('taller.facilitador.librosClave')}</span><span>{t('taller.facilitador.librosValor')}</span></li>
          </ul>
          <blockquote className="cita u-mt-5 reveal" data-d="3">
            {t('matrimonios.facilitador.cita')}<small>{t('matrimonios.facilitador.citaFirma')}</small>
          </blockquote>
        </div>
      </div>
    </Seccion>
  );
}
