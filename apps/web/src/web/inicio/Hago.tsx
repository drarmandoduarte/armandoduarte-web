import { useTranslation } from 'react-i18next';
import { Seccion } from '../comun/Seccion';

/** Qué hago: tres maneras de trabajar juntos, en lista numerada con hairlines. */
export function Hago() {
  const { t } = useTranslation();
  const filas = [
    ['01', t('inicio.hago.unoTitulo'), t('inicio.hago.unoTexto')],
    ['02', t('inicio.hago.dosTitulo'), t('inicio.hago.dosTexto')],
    ['03', t('inicio.hago.tresTitulo'), t('inicio.hago.tresTexto')],
  ];
  return (
    <Seccion id="hago" tono="calido">
      <span className="eyebrow reveal">{t('inicio.hago.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">
        {t('inicio.hago.titulo1')}<br /><span className="suave">{t('inicio.hago.titulo2')}</span>
      </h2>
      <ol className="lista reveal" data-d="2">
        {filas.map(([n, titulo, texto]) => (
          <li key={n}><span className="n">{n}</span><h3>{titulo}</h3><p>{texto}</p></li>
        ))}
      </ol>
    </Seccion>
  );
}
