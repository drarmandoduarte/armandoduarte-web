import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/** Las siete preguntas que te haces en silencio. */
export function Preguntas() {
  const { t } = useTranslation();
  const claves = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete'];
  return (
    <Seccion id="preguntas">
      <span className="eyebrow reveal">{t('taller.preguntas.eyebrow')}</span>
      <h2 className="display-m u-mt-4 reveal" data-d="1">
        {t('taller.preguntas.titulo1')}<br /><span className="suave">{t('taller.preguntas.titulo2')}</span>
      </h2>
      <ol className="preguntas reveal" data-d="2">
        {claves.map((clave, i) => (
          <li key={clave}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            {t(`taller.preguntas.${clave}`)}
          </li>
        ))}
      </ol>
    </Seccion>
  );
}
