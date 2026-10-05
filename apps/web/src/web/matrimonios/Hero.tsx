import { useTranslation } from 'react-i18next';
import { CLAVE_MENSAJE_MATRIMONIOS, TELEFONO_MATRIMONIOS_MEXICO } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Hero as HeroDeLaCasa } from '../comun/Hero';
import { Icono } from '../comun/Icono';

/**
 * El hero de `/matrimonios` (orden #38): el mismo de la portada y de `/merida`
 * (#23), con Armando en el arco. Acá solo van textos, botones y datos.
 *
 * El titular repite la forma de «ADOLESCENTE»: «Cómo sanar un» en tinta y
 * «MATRIMONIO HERIDO» en su propio renglón, en `--naranja-texto`, con la misma
 * clase —`hero-taller__palabra`—, que es la única que `check/acento.mjs`
 * excusa (#12 B). Que sea `block` es lo que deja la cuenta de renglones igual
 * con la tipografía de reserva y con Montserrat (el CLS de la #12).
 *
 * Reservar es WhatsApp al número de México, que es el único naranja; «Ver el
 * programa ↓» va en contorno a las fortalezas, como en `/merida` sin la app.
 */
export function Hero() {
  const { t } = useTranslation();
  return (
    <HeroDeLaCasa
      rotulo={<><Icono nombre="taller" ancho={22} alto={20} />{t('matrimonios.hero.eyebrow')}</>}
      titulo={(
        <>
          {t('matrimonios.hero.titulo1')}{' '}
          <span className="hero-taller__palabra">{t('matrimonios.hero.titulo2Palabra')}</span>
        </>
      )}
      bajada={t('matrimonios.hero.sub')}
      botones={(
        <>
          <BotonWhatsApp
            telefono={TELEFONO_MATRIMONIOS_MEXICO}
            mensaje={t(CLAVE_MENSAJE_MATRIMONIOS)}
            texto={t('matrimonios.reservar')}
            clase="btn btn--naranja"
          />
          <a href="#programa" className="btn">
            {t('matrimonios.hero.ctaPrograma')} <span className="btn-arrow" aria-hidden="true">↓</span>
          </a>
        </>
      )}
      datos={[t('matrimonios.hero.micro1'), t('matrimonios.hero.micro2'), t('matrimonios.hero.micro3')]}
      fotoAlt={t('matrimonios.hero.fotoAlt')}
    />
  );
}
