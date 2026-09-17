import { useTranslation } from 'react-i18next';
import { TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { FotoArco } from '../comun/FotoArco';
import { Icono } from '../comun/Icono';
import { Retrato } from '../comun/Retrato';

/** El hero del taller. Sin fecha: Armando todavía no la dio (orden web #02). */
export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="hero" id="inicio">
      <div className="container hero__grid">
        <div>
          <span className="eyebrow eyebrow--icono reveal">
            <Icono nombre="taller" ancho={22} alto={20} />
            {t('taller.hero.eyebrow')}
          </span>
          <h1 className="display-xl u-mt-4 reveal" data-d="1">
            {t('taller.hero.titulo1')}<br /><span className="acento">{t('taller.hero.titulo2')}</span>
          </h1>
          <p className="hero-sub reveal" data-d="2">{t('taller.hero.sub')}</p>
          <div className="hero-cta reveal" data-d="3">
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
          <p className="hero-micro reveal" data-d="3">
            <span>{t('taller.hero.micro1')}</span>
            <span>{t('taller.hero.micro2')}</span>
            <span>{t('taller.hero.micro3')}</span>
          </p>
        </div>
        <FotoArco demora="2">
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
