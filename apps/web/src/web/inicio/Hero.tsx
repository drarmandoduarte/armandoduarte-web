import { useTranslation } from 'react-i18next';
import { TELEFONO_GABY } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { FotoArco } from '../comun/FotoArco';
import { Retrato } from '../comun/Retrato';

/** El hero del inicio: alto de pantalla, con la foto real a la derecha. */
export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="hero" id="inicio">
      <div className="container hero__grid">
        <div>
          <span className="eyebrow reveal">{t('inicio.hero.eyebrow')}</span>
          <h1 className="display-xl u-mt-4 reveal" data-d="1">
            {t('inicio.hero.titulo1')}<br /><span className="fuerte">{t('inicio.hero.titulo2')}</span>
          </h1>
          <p className="hero-sub reveal" data-d="2">{t('inicio.hero.sub')}</p>
          <div className="hero-cta reveal" data-d="3">
            <a href="/merida" className="btn btn--naranja">
              {t('inicio.hero.ctaTaller')} <span className="btn-arrow">→</span>
            </a>
            <BotonWhatsApp
              telefono={TELEFONO_GABY}
              mensaje={t('comun.mensajes.general')}
              texto={t('inicio.hero.ctaWhatsapp')}
            />
          </div>
          <p className="hero-micro reveal" data-d="3">
            <span>{t('inicio.hero.micro1')}</span>
            <span>{t('inicio.hero.micro2')}</span>
            <span>{t('inicio.hero.micro3')}</span>
          </p>
        </div>
        <FotoArco demora="2">
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
