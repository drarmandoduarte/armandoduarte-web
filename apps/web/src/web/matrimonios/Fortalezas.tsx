import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/**
 * Las cinco fortalezas (orden #38, 6): los núcleos de `/merida` (#23 D) con su
 * movimiento (#28) —la línea de tiempo, la entrada escalonada, el círculo que
 * se pinta—, y con el **número** en el círculo en vez del ícono de Lucía: no
 * hace falta pedirle íconos nuevos (decisión 2 del CEO).
 *
 * Título del núcleo = lo que Armando puso en negrita en el `.docx`; texto = el
 * resto de la línea. El círculo va en terracota, que en esta página ocupa el
 * lugar del teal (`index.css`, «/matrimonios»).
 *
 * `id="programa"` porque ahí apunta «Ver el programa ↓» del hero, como en
 * `/merida`.
 */
export function Fortalezas() {
  const { t } = useTranslation();
  const fortalezas = ['uno', 'dos', 'tres', 'cuatro', 'cinco'] as const;
  return (
    <Seccion id="programa" clase="fortalezas">
      <h2 className="display-l reveal">{t('matrimonios.fortalezas.titulo')}</h2>
      <p className="lead u-mt-4 reveal" data-d="1">{t('matrimonios.fortalezas.bajada')}</p>
      <ol className="nucleos">
        {fortalezas.map((clave, i) => (
          <li className="nucleo reveal" key={clave}>
            <span className="nucleo__circulo nucleo__circulo--numero num">{i + 1}</span>
            <span className="nucleo__linea" aria-hidden="true" />
            <h3>{t(`matrimonios.fortalezas.${clave}.titulo`)}</h3>
            <p>{t(`matrimonios.fortalezas.${clave}.texto`)}</p>
          </li>
        ))}
      </ol>
    </Seccion>
  );
}
