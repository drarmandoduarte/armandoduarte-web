import { useTranslation } from 'react-i18next';
import { SPOTIFY_EN_LA_WEB } from '@codice/core';
import { CANALES } from '../comun/canales';
import { Seccion } from '../comun/Seccion';

/**
 * Construyendo Familias Fuertes: el nombre del primer libro y del trabajo
 * entero. La lista de canales quedó en tres —01 a 03, sin renumerar— cuando la
 * orden web #02 sacó Instagram por falta de cuenta.
 */
export function Programa() {
  const { t } = useTranslation();
  /* #33: el podcast de Spotify se esconde con `SPOTIFY_EN_LA_WEB`, y los que
     quedan se numeran seguidos —01, 02— para que no se lea un hueco. */
  const canales = [
    [CANALES.youtube, t('inicio.programa.unoTitulo'), t('inicio.programa.unoTexto')],
    ...(SPOTIFY_EN_LA_WEB ? [[CANALES.spotify, t('inicio.programa.dosTitulo'), t('inicio.programa.dosTexto')]] : []),
    [CANALES.facebook, t('inicio.programa.tresTitulo'), t('inicio.programa.tresTexto')],
  ].map(([href, titulo, texto], i) => [String(i + 1).padStart(2, '0'), href, titulo, texto]);
  return (
    <Seccion id="programa" tono="calido" contenedor={false}>
      <div className="container grid-2">
        <div>
          <span className="eyebrow reveal">{t('inicio.programa.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('inicio.programa.titulo1')}<br />{t('inicio.programa.titulo2')}
          </h2>
          <p className="body u-mt-4 reveal" data-d="2">{t('inicio.programa.cuerpo')}</p>
          <div className="sello reveal" data-d="3">
            <picture>
              <source type="image/webp" srcSet="img/cff-400.webp 400w, img/cff-800.webp 800w" sizes="200px" />
              <img src="img/cff-800.webp" width={800} height={192} alt={t('inicio.programa.selloAlt')} loading="lazy" />
            </picture>
          </div>
        </div>
        <ol className="lista lista--2 reveal" data-d="2">
          {canales.map(([n, href, titulo, texto]) => (
            <li key={n}>
              <span className="n">{n}</span>
              <div>
                <h3><a href={href} target="_blank" rel="noopener">{titulo} <span className="btn-arrow">→</span></a></h3>
                <p>{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Seccion>
  );
}
