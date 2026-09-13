import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/** Por qué las estrategias del pasado ya no funcionan. */
export function Porque() {
  const { t } = useTranslation();
  return (
    <Seccion id="porque" tono="calido" contenedor={false}>
      <div className="container grid-2">
        <div>
          <span className="eyebrow reveal">{t('taller.porque.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('taller.porque.titulo1')}<br /><span className="suave">{t('taller.porque.titulo2')}</span>
          </h2>
        </div>
        <div>
          <p className="body reveal" data-d="2">{t('taller.porque.cuerpo1')}</p>
          <p className="body reveal" data-d="2">{t('taller.porque.cuerpo2')}</p>
        </div>
      </div>
    </Seccion>
  );
}
