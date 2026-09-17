import { useTranslation } from 'react-i18next';
import { TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { FotoArco } from '../comun/FotoArco';
import { Icono } from '../comun/Icono';
import { Retrato } from '../comun/Retrato';

/** El hero del taller. Sin fecha: Armando todavía no la dio (orden web #02). */
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
          <span className="eyebrow eyebrow--icono">
            <Icono nombre="taller" ancho={22} alto={20} />
            {t('taller.hero.eyebrow')}
          </span>
          <h1 className="display-xl u-mt-4">
            {t('taller.hero.titulo1')}<br /><span className="acento">{t('taller.hero.titulo2')}</span>
          </h1>
          <p className="hero-sub">{t('taller.hero.sub')}</p>
          <div className="hero-cta">
            <BotonWhatsApp
              telefono={TELEFONO_TALLER}
              mensaje={t('comun.mensajes.reservar')}
              texto={t('taller.hero.ctaReservar')}
              clase="btn btn--naranja"
            />
            <a href="#programa" className="btn">
              {t('taller.hero.ctaPrograma')} <span className="btn-arrow">→</span>
            </a>
          </div>
          <p className="hero-micro">
            <span>{t('taller.hero.micro1')}</span>
            <span>{t('taller.hero.micro2')}</span>
            <span>{t('taller.hero.micro3')}</span>
          </p>
        </div>
        {/* Sin `reveal`: el hero se pinta entero (orden #07, D). */}
        <FotoArco clase="foto foto--arco">
          <Retrato
            cual="medio-cuerpo"
            alt={t('taller.hero.fotoAlt')}
            tamanos="(max-width:900px) 420px, 520px"
            prioridad
          />
        </FotoArco>
      </div>
    </section>
  );
}
