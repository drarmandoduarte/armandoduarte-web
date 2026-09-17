import { useTranslation } from 'react-i18next';
import { Retrato } from '../comun/Retrato';
import { Seccion } from '../comun/Seccion';

/** Quién soy: la foto libre a la izquierda, la ficha y la cita a la derecha. */
export function Quien() {
  const { t } = useTranslation();
  return (
    <Seccion id="quien" contenedor={false}>
      <div className="container grid-2 centro">
        <figure className="foto foto--libre reveal" style={{ maxWidth: '520px' }}>
          <Retrato cual="de-pie" alt={t('inicio.quien.fotoAlt')} tamanos="(max-width:900px) 92vw, 520px" />
        </figure>
        <div>
          <span className="eyebrow reveal">{t('inicio.quien.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('inicio.quien.titulo1')}<br /><span className="suave">{t('inicio.quien.titulo2')}</span>
          </h2>
          <p className="body u-mt-4 reveal" data-d="2">{t('inicio.quien.cuerpo')}</p>
          <ul className="ficha reveal" data-d="2">
            <li><span>{t('inicio.quien.fichaFormacionClave')}</span><span>{t('inicio.quien.fichaFormacionValor')}</span></li>
            <li><span>{t('inicio.quien.fichaPracticaClave')}</span><span>{t('inicio.quien.fichaPracticaValor')}</span></li>
            <li>
              <span>{t('inicio.quien.fichaObraClave')}</span>
              <span>
                {t('inicio.quien.fichaObraAntes')}
                <em>{t('inicio.quien.fichaObraLibro1')}</em>
                {t('inicio.quien.fichaObraEntre')}
                <em>{t('inicio.quien.fichaObraLibro2')}</em>
              </span>
            </li>
            <li><span>{t('inicio.quien.fichaBaseClave')}</span><span>{t('inicio.quien.fichaBaseValor')}</span></li>
          </ul>
          <blockquote className="cita u-mt-5 reveal" data-d="3">
            {t('inicio.quien.cita')}<small>{t('inicio.quien.citaFirma')}</small>
          </blockquote>
        </div>
      </div>
    </Seccion>
  );
}
