import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/**
 * Sobre el facilitador. Las claves de la ficha llevan un color escrito a mano
 * en el original —crema al 60 %— porque la regla `.oscuro .ficha li
 * span:first-child` ya lo hace: el `style` es redundante. Se porta igual, con el
 * mismo valor: quitarlo sería correcto y sería un cambio, y esta orden no hace
 * cambios.
 */
export function Facilitador() {
  const { t } = useTranslation();
  const clave = { color: 'rgba(250,247,241,.6)' };
  return (
    <Seccion id="facilitador" tono="oscuro" contenedor={false}>
      <div className="container grid-2 centro">
        <figure className="foto foto--libre reveal" style={{ maxWidth: '480px' }}>
          <img src="img/armando-parado-teal.jpg" width={1094} height={1750} alt={t('taller.facilitador.fotoAlt')} loading="lazy" />
        </figure>
        <div>
          <span className="eyebrow reveal">{t('taller.facilitador.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('taller.facilitador.titulo1')}<br /><span className="suave">{t('taller.facilitador.titulo2')}</span>
          </h2>
          <ul className="ficha reveal" data-d="2">
            <li><span style={clave}>{t('taller.facilitador.familiaClave')}</span><span>{t('taller.facilitador.familiaValor')}</span></li>
            <li><span style={clave}>{t('taller.facilitador.practicaClave')}</span><span>{t('taller.facilitador.practicaValor')}</span></li>
            <li><span style={clave}>{t('taller.facilitador.formacionClave')}</span><span>{t('taller.facilitador.formacionValor')}</span></li>
            <li><span style={clave}>{t('taller.facilitador.obraClave')}</span><span>{t('taller.facilitador.obraValor')}</span></li>
          </ul>
          <blockquote className="cita u-mt-5 reveal" data-d="3">
            {t('taller.facilitador.cita')}<small>{t('taller.facilitador.citaFirma')}</small>
          </blockquote>
        </div>
      </div>
    </Seccion>
  );
}
