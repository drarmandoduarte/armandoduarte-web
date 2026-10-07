import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { MI_ESPACIO_EN_LA_WEB } from '@codice/core';
import { Legal } from './Legal';

/** Los términos de uso. Cortos a propósito, como dice su propia bajada. */
export function Terminos() {
  const { t } = useTranslation();
  /* «Qué es este sitio» nombra Mi espacio solo con la bandera prendida (#42):
     apagada (#33), esa frase diría algo que no es cierto. Vuelve sola el día
     que se prenda. */
  const queEs = t('terminos.queEsTexto')
    + (MI_ESPACIO_EN_LA_WEB ? t('terminos.queEsMiEspacio') : '')
    + t('terminos.queEsCierre');
  const bloques = [
    ['reservasTitulo', 'reservasTexto', 'u-mt-6'],
    ['contenidoTitulo', 'contenidoTexto', 'u-mt-6'],
    ['talCualTitulo', 'talCualTexto', 'u-mt-6'],
    ['leyTitulo', 'leyTexto', 'u-mt-6'],
  ] as const;

  return (
    <Legal pagina="terminos" titulo={t('terminos.titulo')} lead={t('terminos.lead')}>
      <h2 className="display-s u-mt-7">{t('terminos.queEsTitulo')}</h2>
      <p className="body u-mt-3">{queEs}</p>
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
