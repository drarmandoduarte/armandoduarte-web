import { useTranslation } from 'react-i18next';
import { TELEFONO_GABY } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Hero as HeroDeLaCasa } from '../comun/Hero';

/**
 * El hero de la portada. Desde la #23 (A) es el mismo componente que el del
 * taller (`comun/Hero.tsx`): acá solo van los textos y los botones.
 */
export function Hero() {
  const { t } = useTranslation();
  return (
    <HeroDeLaCasa
      rotulo={t('inicio.hero.eyebrow')}
      titulo={<>{t('inicio.hero.titulo1')}<br /><span className="fuerte">{t('inicio.hero.titulo2')}</span></>}
      bajada={t('inicio.hero.sub')}
      botones={(
        <>
          <a href="/merida" className="btn btn--naranja">
            {t('inicio.hero.ctaTaller')} <span className="btn-arrow">→</span>
          </a>
          <BotonWhatsApp
            telefono={TELEFONO_GABY}
            mensaje={t('comun.mensajes.general')}
            texto={t('inicio.hero.ctaWhatsapp')}
          />
        </>
      )}
      datos={[t('inicio.hero.micro1'), t('inicio.hero.micro2'), t('inicio.hero.micro3')]}
      fotoAlt={t('inicio.hero.fotoAlt')}
    />
  );
}
