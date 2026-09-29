import { useTranslation } from 'react-i18next';
import { CLAVE_MENSAJE_RESERVA, TELEFONO_TALLER } from '@codice/core';
import { BotonWhatsApp } from '../comun/BotonWhatsApp';
import { FotoArco } from '../comun/FotoArco';
import { Icono } from '../comun/Icono';
import { Retrato } from '../comun/Retrato';

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
      <div className="container hero__grid hero__grid--taller">
        <div>
          <span className="eyebrow eyebrow--icono">
            <Icono nombre="taller" ancho={22} alto={20} />
            {t('taller.hero.eyebrow')}
          </span>
          {/* Dos renglones y dos colores — orden #16, A. Los dos saltos son de
              CSS y ninguno es un `<br>`: `hero-taller__atu` es `inline` de 600
              px para arriba y `block` para abajo, y `hero-taller__palabra` es
              `block` siempre (lo puso la #12 por el CLS). Por qué así y no con
              `text-wrap: balance`, en `index.css`, arriba de las dos reglas. */}
          <h1 className="display-xl u-mt-4">
            {t('taller.hero.titulo1')}{' '}
            <span className="hero-taller__atu">{t('taller.hero.titulo2')}</span>
            <span className="hero-taller__palabra">{t('taller.hero.titulo2Palabra')}</span>
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
