import { useTranslation } from 'react-i18next';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { FotoArco } from '../comun/FotoArco';

/** El hero del taller. Sin fecha: Armando todavía no la dio (orden web #02). */
export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="hero" id="inicio">
      <div className="container hero__grid">
        <div>
          <span className="eyebrow reveal">{t('taller.hero.eyebrow')}</span>
          <h1 className="display-xl u-mt-4 reveal" data-d="1">
            {t('taller.hero.titulo1')}<br /><span className="acento">{t('taller.hero.titulo2')}</span>
          </h1>
          <p className="hero-sub reveal" data-d="2">{t('taller.hero.sub')}</p>
          <div className="hero-cta reveal" data-d="3">
            <BotonWhatsApp
              mensaje={t('comun.mensajes.reservar')}
              texto={t('taller.hero.ctaReservar')}
              clase="btn btn--ocre"
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
        <FotoArco
          src="img/armando-sentado-calido.jpg"
          alt={t('taller.hero.fotoAlt')}
          ancho={1167}
          alto={1750}
          prioridad
          demora="2"
        />
      </div>
    </section>
  );
}
