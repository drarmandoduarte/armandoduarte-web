import { useTranslation } from 'react-i18next';
import { TELEFONO_GABY } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { FotoArco } from '../comun/FotoArco';
import { Retrato } from '../comun/Retrato';

/** El hero del inicio: alto de pantalla, con la foto real a la derecha. */
/**
 * ── El hero se pinta en el primer cuadro (orden #07, D) ──────────────────
 * Nada de acá lleva `.reveal`. El fundido de entrada está bien para lo que hay
 * que bajar a buscar, pero aplicado a lo primero que se ve hace que la página
 * aparezca lavada y se arme de a pedazos durante medio segundo — y el h1, que
 * es el LCP, espera al `IntersectionObserver` para existir. 512 revela a partir
 * de la segunda sección. El resto de la web sigue con `.reveal` sin cambios.
 */
export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="hero" id="inicio">
      <div className="container hero__grid">
        <div>
          <span className="eyebrow">{t('inicio.hero.eyebrow')}</span>
          <h1 className="display-xl u-mt-4">
            {t('inicio.hero.titulo1')}<br /><span className="fuerte">{t('inicio.hero.titulo2')}</span>
          </h1>
          <p className="hero-sub">{t('inicio.hero.sub')}</p>
          <div className="hero-cta">
            <a href="/merida" className="btn btn--naranja">
              {t('inicio.hero.ctaTaller')} <span className="btn-arrow">→</span>
            </a>
            <BotonWhatsApp
              telefono={TELEFONO_GABY}
              mensaje={t('comun.mensajes.general')}
              texto={t('inicio.hero.ctaWhatsapp')}
            />
          </div>
          <p className="hero-micro">
            <span>{t('inicio.hero.micro1')}</span>
            <span>{t('inicio.hero.micro2')}</span>
            <span>{t('inicio.hero.micro3')}</span>
          </p>
        </div>
        {/* Sin `reveal`: el hero se pinta entero (orden #07, D). */}
        <FotoArco clase="foto foto--arco">
          <Retrato
            cual="medio-cuerpo"
            alt={t('inicio.hero.fotoAlt')}
            tamanos="(max-width:900px) 420px, 520px"
            prioridad
          />
        </FotoArco>
      </div>
    </section>
  );
}
