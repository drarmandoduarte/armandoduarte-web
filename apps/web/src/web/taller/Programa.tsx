import { useTranslation } from 'react-i18next';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Seccion } from '../comun/Seccion';

/**
 * Los cuatro núcleos y lo que te llevas.
 *
 * Los pasos llevan una línea entre el número y el siguiente, que se apaga en el
 * último (`.paso:last-child .paso__line`) y en pantallas de menos de 1100px. El
 * `<span class="paso__line">` va igual en los cuatro: quién se ve y quién no lo
 * decide el CSS, no el marcado.
 */
export function Programa() {
  const { t } = useTranslation();
  const nucleos = [
    ['01', '1', 'uno'],
    ['02', '2', 'dos'],
    ['03', '3', 'tres'],
    ['04', '3', 'cuatro'],
  ] as const;

  return (
    <Seccion id="programa">
      <span className="eyebrow reveal">{t('taller.programa.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">
        {t('taller.programa.titulo1')}<br /><span className="suave">{t('taller.programa.titulo2')}</span>
      </h2>
      <div className="pasos">
        {nucleos.map(([n, demora, clave]) => (
          <div className="paso reveal" data-d={demora} key={n}>
            <div className="paso__head"><span className="paso__num">{n}</span><span className="paso__line" /></div>
            <h3><b>{t(`taller.programa.${clave}.rotulo`)}</b>{t(`taller.programa.${clave}.titulo`)}</h3>
            <p>{t(`taller.programa.${clave}.texto1`)}</p>
            <p>{t(`taller.programa.${clave}.texto2`)}</p>
          </div>
        ))}
      </div>
      <p className="receso reveal">{t('taller.programa.receso')}</p>

      <div className="u-mt-8">
        <span className="eyebrow reveal">{t('taller.llevas.eyebrow')}</span>
        <h2 className="display-m u-mt-4 reveal" data-d="1">{t('taller.llevas.titulo')}</h2>
        <div className="tres reveal" data-d="2">
          <div><span className="n">01</span><h3>{t('taller.llevas.unoTitulo')}</h3><p>{t('taller.llevas.unoTexto')}</p></div>
          <div><span className="n">02</span><h3>{t('taller.llevas.dosTitulo')}</h3><p>{t('taller.llevas.dosTexto')}</p></div>
          <div><span className="n">03</span><h3>{t('taller.llevas.tresTitulo')}</h3><p>{t('taller.llevas.tresTexto')}</p></div>
        </div>
        <div className="hero-cta reveal" data-d="3">
          <BotonWhatsApp
            mensaje={t('comun.mensajes.programa')}
            texto={t('taller.llevas.cta')}
            clase="btn btn--ocre"
          />
        </div>
      </div>
    </Seccion>
  );
}
