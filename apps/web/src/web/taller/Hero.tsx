import { useTranslation } from 'react-i18next';
import { CLAVE_MENSAJE_RESERVA, TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { FotoArco } from '../comun/FotoArco';
import { Icono } from '../comun/Icono';
import { Retrato } from '../comun/Retrato';

/** El hero del taller, con la fecha desde la orden #12 (A). */
/**
 * ── «ADOLESCENTE» en naranja: una excepción declarada, no una regla nueva ──
 * Lo pidió Lucía el 28/9 y entra por D23. Rompe la regla del acento de la #07
 * —«el naranja aparece una vez por pantalla: el CTA»— y por eso está escrito
 * acá y en `docs/tareas.md`: es **una** excepción, en **un** elemento, con su
 * propio selector, y `check/acento.mjs` permite ese selector y ningún otro. El
 * día que alguien pinte otra palabra de naranja, el barrido se pone rojo.
 *
 * El acento de la palabra es `--naranja-texto` y no `--naranja`, aunque a 80 px
 * los dos pasen su umbral: es el que el resto del sitio usa para texto, y tener
 * dos naranjas de texto en la misma web es la clase de diferencia que nadie
 * elige y que después nadie puede explicar. El número medido va en el informe.
 */
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
            {t('taller.hero.titulo1')}<br />
            <span className="acento">
              {t('taller.hero.titulo2')} <span className="hero-taller__palabra">{t('taller.hero.titulo2Palabra')}</span>
            </span>
          </h1>
          <p className="hero-sub">{t('taller.hero.sub')}</p>
          <div className="hero-cta">
            {/* El mensaje sale de `CLAVE_MENSAJE_RESERVA` (#14): el enlace de
                reservar se elegía acá y otra vez en `Taller.tsx`, y con el del pie
                habrían sido tres. `BotonWhatsApp` sigue recibiendo número y texto
                por separado porque dibuja, no decide. */}
            <BotonWhatsApp
              telefono={TELEFONO_TALLER}
              mensaje={t(CLAVE_MENSAJE_RESERVA)}
              texto={t('taller.hero.ctaReservar')}
              clase="btn btn--naranja"
            />
            <a href="#programa" className="btn">
              {t('taller.hero.ctaPrograma')} <span className="btn-arrow">→</span>
            </a>
          </div>
          {/* Tres datos y no cuatro: la fecha **reemplaza** a «Cupo limitado»,
              que es una de las dos salidas que la orden #12 (A) dejaba abiertas.
              Medido a 375: con cuatro, la línea se parte en **tres** renglones
              (61 px de alto) y deja de leerse como una línea de hechos; con
              tres entra en dos (41 px). El cupo no se pierde —sigue en la ficha
              de la portada, en la descripción de la página y en «Inversión»—;
              la fecha es el dato que faltaba. */}
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
