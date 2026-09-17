import { useTranslation } from 'react-i18next';
import { CANALES } from '../comun/canales';
import { Seccion } from '../comun/Seccion';

/**
 * Los dos libros.
 *
 * ── Uno tiene portada y el otro no (orden #07, decisión 4) ──────────────
 * *Construyendo Familias Fuertes* pasa a su **portada real**, recortada del
 * mockup público de la ficha de San Pablo. Un lomo dibujado al lado de un libro
 * que existe y se puede comprar era la pieza más falsa de la página.
 *
 * De *Padres digitalmente responsables* **no hay portada publicada en ningún
 * lado**, así que se queda con el lomo dibujado — en navy, que es el color de su
 * propio rótulo, y ya no en naranja. No se inventa una portada.
 *
 * El lomo va `aria-hidden` porque el título ya está al lado, en el `<h3>`, y un
 * lector de pantalla que lo lea dos veces suena a error. La portada real sí
 * lleva `alt`: es una imagen con información que el texto de al lado no da.
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
          <figure className="tapa tapa--foto">
            <picture>
              <source
                type="image/webp"
                srcSet="img/fotos/portada-familias-400.webp 400w, img/fotos/portada-familias-800.webp 800w"
                sizes="150px"
              />
              <img
                src="img/fotos/portada-familias-800.webp"
                width={544}
                height={784}
                alt={t('inicio.libros.unoPortadaAlt')}
                loading="lazy"
              />
            </picture>
          </figure>
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
