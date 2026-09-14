import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Legal } from './Legal';

/** Los términos de uso. Cortos a propósito, como dice su propia bajada. */
export function Terminos() {
  const { t } = useTranslation();
  const bloques = [
    ['queEsTitulo', 'queEsTexto', 'u-mt-7'],
    ['reservasTitulo', 'reservasTexto', 'u-mt-6'],
    ['contenidoTitulo', 'contenidoTexto', 'u-mt-6'],
    ['talCualTitulo', 'talCualTexto', 'u-mt-6'],
    ['leyTitulo', 'leyTexto', 'u-mt-6'],
  ] as const;

  return (
    <Legal pagina="terminos" titulo={t('terminos.titulo')} lead={t('terminos.lead')}>
      {bloques.map(([titulo, texto, margen]) => (
        <Fragment key={titulo}>
          <h2 className={`display-s ${margen}`}>{t(`terminos.${titulo}`)}</h2>
          <p className="body u-mt-3">{t(`terminos.${texto}`)}</p>
        </Fragment>
      ))}
      <p className="small u-mt-6">{t('terminos.actualizacion')}</p>
    </Legal>
  );
}
