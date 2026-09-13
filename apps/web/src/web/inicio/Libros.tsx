import { useTranslation } from 'react-i18next';
import { CANALES } from '../comun/canales';
import { Seccion } from '../comun/Seccion';

/**
 * Los dos libros. Las tapas son CSS puro —ocre y navy, con el nombre escrito
 * encima— y no imágenes: van `aria-hidden` porque el título ya está al lado, en
 * el `<h3>`, y un lector de pantalla que lea el nombre dos veces suena a error.
 */
export function Libros() {
  const { t } = useTranslation();
  return (
    <Seccion id="libros" tono="blanco">
      <span className="eyebrow reveal">{t('inicio.libros.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">
        {t('inicio.libros.titulo1')}<br /><span className="suave">{t('inicio.libros.titulo2')}</span>
      </h2>
      <div className="libros reveal" data-d="2">
        <article className="libro">
          <div className="tapa ocre" aria-hidden="true">
            <small>{t('inicio.libros.tapaAutor')}</small><b>{t('inicio.libros.unoTapa')}</b>
          </div>
          <div>
            <h3>{t('inicio.libros.unoTitulo')}</h3>
            <p>{t('inicio.libros.unoTexto')}</p>
            <p className="u-mt-3">
              <a className="link" href={CANALES.sanPablo} target="_blank" rel="noopener">
                {t('inicio.libros.unoCta')} <span className="btn-arrow">→</span>
              </a>
            </p>
          </div>
        </article>
        <article className="libro">
          <div className="tapa navy" aria-hidden="true">
            <small>{t('inicio.libros.tapaAutor')}</small><b>{t('inicio.libros.dosTapa')}</b>
          </div>
          <div>
            <h3>{t('inicio.libros.dosTitulo')}</h3>
            <p>{t('inicio.libros.dosTexto')}</p>
          </div>
        </article>
      </div>
    </Seccion>
  );
}
