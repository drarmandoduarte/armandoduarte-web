import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/** Lo que dicen al salir. Dos, reales, con nombre y contexto. */
export function Testimonios() {
  const { t } = useTranslation();
  return (
    <Seccion id="testimonios" tono="blanco">
      <span className="eyebrow reveal">{t('taller.testimonios.eyebrow')}</span>
      <h2 className="display-m u-mt-4 reveal" data-d="1">
        {t('taller.testimonios.titulo1')}<br /><span className="suave">{t('taller.testimonios.titulo2')}</span>
      </h2>
      <div className="testimonios">
        <div className="testimonio reveal" data-d="1">
          <p>{t('taller.testimonios.unoTexto')}</p>
          <small>{t('taller.testimonios.unoFirma')}</small>
        </div>
        <div className="testimonio reveal" data-d="2">
          <p>{t('taller.testimonios.dosTexto')}</p>
          <small>{t('taller.testimonios.dosFirma')}</small>
        </div>
      </div>
    </Seccion>
  );
}
