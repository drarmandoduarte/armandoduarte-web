import { useTranslation } from 'react-i18next';
import { CLAVE_MENSAJE_RESERVA, TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { Hero as HeroDeLaCasa } from '../comun/Hero';
import { Icono } from '../comun/Icono';
import { enlaceReservarMiLugar } from '../comun/mi-espacio';

/** El hero del taller, con la fecha desde la orden #12 (A). */
/**
 * ── Dos renglones y dos colores (orden #16, A) ────────────────────────────
 * Hasta la #16 el titular decía «El arte de amar / a tu / ADOLESCENTE.»: tres
 * renglones, y el del medio era «a tu» **en teal**, entre una línea tinta y una
 * naranja. Tres colores y un renglón de dos palabras cortas en el título más
 * importante del sitio.
 *
 * Ahora son **dos renglones y dos colores** de 600 px para arriba: «El arte de
 * amar a tu» en `--tinta` y «ADOLESCENTE.» en `--naranja-texto`. **El teal se
 * va**, y es una decisión de dirección: con la palabra en naranja el teal ya no
 * marcaba nada y competía con el acento. Está anotada en `docs/tareas.md` al
 * lado de la excepción de la #12, que **no cambia** —sigue siendo un elemento,
 * con tope 1—.
 *
 * ── Por qué el reparto es estructural y no `text-wrap: balance` ──────────
 * Se probó con `balance` primero, que es lo que la orden proponía, y **se midió
 * que reabría el CLS que la #12 había cerrado**: con el titular en una sola
 * cadena, la tipografía de reserva lo acomoda en dos renglones y Montserrat en
 * tres, y cuando la buena entra el titular crece y empuja la foto. Ocho de los
 * doce anchos quedaban con distinta cuenta y `/merida` llegaba a **0,1765** de
 * CLS a 390 px. La tabla está en `docs/informes/16/LEEME.md`.
 *
 * Así que los dos saltos son de CSS y **ninguno depende de la tipografía**:
 * «ADOLESCENTE.» es `block` siempre (lo puso la #12) y «a tu» es `inline` de 600
 * px para arriba y `block` para abajo. Con eso el titular mide **dos renglones
 * arriba de 600 y tres abajo, con las dos tipografías, a los doce anchos**, y no
 * hay nada que se corra. `balance` igual entra al design system por la #16 (B):
 * gobierna el resto de los títulos del sitio, donde no hay una forma aprobada
 * que defender.
 *
 * Por eso las tres claves de i18n **no se movieron**: `titulo1`, `titulo2` y
 * `titulo2Palabra` siguen siendo las mismas tres cadenas. Lo que cambió es
 * cuándo el navegador las pone juntas.
 */
/**
 * ── Desde la #23 (A), el mismo hero que la portada ───────────────────────
 * `comun/Hero.tsx`: acá solo van textos, botones y la línea de datos. La
 * columna más ancha que la #16 le había dado a este hero se fue con eso, y el
 * titular pasó a tres renglones en todos los anchos: «El arte de» / «amar a
 * tu» / «ADOLESCENTE.». Ver `index.css`, arriba de `.hero-taller__atu`.
 */
export function Hero() {
  const { t } = useTranslation();
  return (
    <HeroDeLaCasa
      rotulo={<><Icono nombre="taller" ancho={22} alto={20} />{t('taller.hero.eyebrow')}</>}
      /* Tres renglones y dos colores. Los saltos son de CSS y ninguno es un
         `<br>`: `hero-taller__atu` y `hero-taller__palabra` son `block`. Por qué
         así y no con `text-wrap: balance`, en `index.css`. */
      titulo={(
        <>
          {t('taller.hero.titulo1')}{' '}
          <span className="hero-taller__atu">{t('taller.hero.titulo2')}</span>
          <span className="hero-taller__palabra">{t('taller.hero.titulo2Palabra')}</span>
        </>
      )}
      bajada={t('taller.hero.sub')}
      botones={(
        <>
          {/* #25: «Reservar mi lugar» lleva a la app —entrar y caer en «Me
              anoto» con este taller elegido— y es el único naranja. WhatsApp
              queda segundo, en contorno, para quien prefiera hablar con Gaby;
              su mensaje sigue saliendo de `CLAVE_MENSAJE_RESERVA` (#14). */}
          <a href={enlaceReservarMiLugar()} className="btn btn--naranja">
            {t('taller.hero.ctaReservar')} <span className="btn-arrow">→</span>
          </a>
          <BotonWhatsApp
            telefono={TELEFONO_TALLER}
            mensaje={t(CLAVE_MENSAJE_RESERVA)}
            texto={t('taller.hero.ctaWhatsapp')}
            clase="btn"
          />
        </>
      )}
      /* Tres datos y no cuatro: la fecha **reemplaza** a «Cupo limitado»
         (orden #12, A). Con cuatro, a 375 la línea se parte en tres renglones
         y deja de leerse como una línea de hechos. */
      datos={[t('taller.hero.micro1'), t('taller.hero.micro2'), t('taller.hero.micro3')]}
      fotoAlt={t('taller.hero.fotoAlt')}
    />
  );
}
