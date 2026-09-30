import { useTranslation } from 'react-i18next';
import { CANALES } from '../comun/canales';
import { Icono } from '../comun/Icono';
import { Seccion } from '../comun/Seccion';

/**
 * La franja de hechos y «¿Te suena?».
 *
 * ── La franja volvió a cuatro celdas (orden #12, A) ──────────────────────
 * El «Cuándo» se había eliminado en la #02 porque no había fecha, y `.hechos`
 * pasó a tres columnas en el mismo cambio, con una nota que decía: «cuando
 * Armando dé la fecha, vuelve la celda y el CSS vuelve a cuatro». Armando la dio
 * el 28/9. Volvió la celda, volvió el CSS, y el ícono del calendario es el
 * único que esta orden dibujó — en el estilo de los otros tres: círculo de
 * `--teal-medio`, glifo blanco de trazo 5, sobre el mismo lienzo de 96.
 *
 * ── La fotografía de fondo, cuarta vez y esta vez como la pidió Lucía ───
 * Conviene el relato entero, porque cada vuelta corrigió a la anterior:
 *
 *   · **#05** — fondo de toda la sección con un velo crema uniforme. Al 88 %
 *     daba **14 pares bajo AA** —medido sobre el píxel dibujado— y hubo que
 *     subirlo a 94 %, donde la foto ya no es una imagen sino una textura. El
 *     problema no era el velo: era que encima había ocho bloques de texto
 *     chico, y cada uno necesita 4,5:1 contra lo que tenga detrás.
 *   · **#07** — se la movió a la tarjeta de la cita, donde el único texto
 *     encima es una frase de 30 px en crema. Ahí la foto se ve, porque aguanta
 *     mucho menos velo.
 *   · **#12** — Lucía la quiso otra vez de fondo. Se hizo, pero **se cambió la
 *     maqueta**: el texto pasó a un panel angosto a la izquierda, los tres
 *     puntos se apilaron debajo del título, y la foto se estiró al 150 % a la
 *     derecha. A 1440 se veía **el pelo y la frente del chico**, nada más.
 *     Lucía no pidió eso: pidió la sección como estaba, con la foto detrás.
 *   · **#19** — vuelve la maqueta de antes de la #12 (dos columnas: título y
 *     párrafo a la izquierda, los tres puntos a la derecha; la cita abajo en
 *     tarjeta cálida a lo ancho) y la foto vuelve a ser el fondo de **toda** la
 *     sección, sin estirar: `object-fit: cover` y nada más, para que el rostro
 *     se vea entero.
 *
 * ── Y el velo se midió, no se eligió ────────────────────────────────────
 * La orden #19 fija el orden de las pruebas y con cuál quedarse: el primero que
 * dé **0 pares bajo AA** a 1440, 900 y 375 con la foto cargada. El número que
 * quedó está escrito en `index.css`, al lado de la regla, con lo que se probó
 * antes.
 *
 * ── La franja de hechos ahora TAMBIÉN va sobre la foto ───────────────────
 * En la #12 la foto arrancaba debajo de la franja, y el informe lo declaró como
 * la lectura elegida: la franja es texto chico suelto (rótulos de 11 px) y
 * ponerlo sobre fotografía era repetir el defecto que la #05 pagó con 14 pares.
 * La #19 dice «toda la sección», así que la franja entra — y lo que la sostiene
 * no es una opinión sino la medición: si los rótulos de 11 px no pasan con el
 * velo en degradado, entra el suelo local del punto (ii) de la orden.
 */
export function Suena() {
  const { t } = useTranslation();
  const sintomas = [
    ['01', t('taller.suena.unoTitulo'), t('taller.suena.unoTexto')],
    ['02', t('taller.suena.dosTitulo'), t('taller.suena.dosTexto')],
    ['03', t('taller.suena.tresTitulo'), t('taller.suena.tresTexto')],
  ];
  return (
    /* `con-fondo` es lo que hace que `check/contraste.mjs` mida el píxel
       realmente dibujado detrás de cada línea en vez del color declarado: sin
       esa clase el barrido sube por los padres, encuentra el blanco de la
       sección e informa un contraste que no existe, porque entre ese blanco y
       el texto hay una fotografía. */
    <Seccion id="suena" tono="blanco" clase="suena-fondo con-fondo" contenedor={false}>
      {/* ── La foto, con el encuadre de Lucía (orden #21, B) ─────────────────
          La misma foto de siempre (Pexels 6345445, Karola G), **recortada del
          original** por el CEO para que con `cover` en una sección apaisada se
          vea como en la captura de Lucía: cabeza grande y centrada, pelo contra
          el borde de arriba, remera a rayas abajo. El recorte está en
          `03 Producto/web/insumos/2026-09-30-te-suena-como-lucia/`, con su
          LEEME. Entra con **nombres nuevos**: una URL nueva no puede quedar
          atrapada en la caché vieja (lo mismo que resuelve la #21 A).

          Tres tamaños por `<source media>` y no por `srcset`/`sizes`, por la
          razón de la #14 (D): aquél multiplica por el DPR y un teléfono 3× se
          llevaría la grande. 2400 por encima de 1100 px, 1600 hasta 1100, 900
          hasta 600. El `<img>` es el JPG de 1600: el respaldo de quien no
          entiende WebP. */}
      <div className="fondo-foto fondo-foto--suena">
        <picture>
          <source
            type="image/webp"
            media="(min-width: 1101px)"
            srcSet="img/fotos/suena-lucia-2400.webp"
            width={2400}
            height={1708}
          />
          <source
            type="image/webp"
            media="(min-width: 601px)"
            srcSet="img/fotos/suena-lucia-1600.webp"
            width={1600}
            height={1138}
          />
          <source type="image/webp" srcSet="img/fotos/suena-lucia-900.webp" width={900} height={640} />
          <img
            src="img/fotos/suena-lucia-1600.jpg"
            width={1600}
            height={1138}
            alt=""
            aria-hidden="true"
            loading="lazy"
            /* Decorativa y por debajo del pliegue. `fetchPriority="low"` y
               `decoding="async"` son correctos para una imagen así; lo que la
               #16 midió es que el costo de esta foto en `/merida` móvil es de
               pintado, no de descarga. */
            decoding="async"
            fetchPriority="low"
          />
        </picture>
      </div>

      <div className="container">
        <div className="hechos reveal">
          <div>
            <Icono nombre="fecha" ancho={40} alto={40} />
            <span>{t('taller.hechos.fechaClave')}</span><b>{t('taller.hechos.fechaValor')}</b>
          </div>
          <div>
            <Icono nombre="horario" ancho={40} alto={39} />
            <span>{t('taller.hechos.horarioClave')}</span><b>{t('taller.hechos.horarioValor')}</b>
          </div>
          <div>
            <Icono nombre="lugar" ancho={40} alto={40} />
            <span>{t('taller.hechos.dondeClave')}</span>
            {/* ── El lugar abre el mapa (orden #20, E) ──────────────────────
                El **texto no cambia**: es la misma clave, y el test del evento
                lo compara con `location.name` del JSON-LD. Lo que se agrega es
                el `<a>` alrededor.

                El `aria-label` dice a dónde lleva porque el texto solo no lo
                dice: «Fiesta Inn Mérida» leído por un lector de pantalla es el
                nombre de un hotel, no «esto abre un mapa».

                La CSP no cambia: un `href` externo es navegación, no carga de
                recurso. */}
            <b>
              <a
                href={CANALES.mapaSede}
                target="_blank"
                rel="noopener"
                aria-label={t('taller.hechos.dondeAria')}
              >
                {t('taller.hechos.dondeValor')}
              </a>
            </b>
          </div>
          <div>
            <Icono nombre="sesion" ancho={40} alto={40} />
            <span>{t('taller.hechos.modalidadClave')}</span><b>{t('taller.hechos.modalidadValor')}</b>
          </div>
        </div>

        {/* La maqueta de antes de la #12, recuperada de `4b592d2^`: dos
            columnas —título y párrafo | los tres puntos— y la cita abajo. */}
        <div className="grid-2 u-mt-8">
          <div>
            <span className="eyebrow reveal">{t('taller.suena.eyebrow')}</span>
            <h2 className="display-m u-mt-4 reveal" data-d="1">
              {t('taller.suena.titulo1')}<br /><span className="suave">{t('taller.suena.titulo2')}</span>
            </h2>
            <p className="body u-mt-4 reveal" data-d="2">{t('taller.suena.cuerpo')}</p>
          </div>
          <ol className="lista lista--2 reveal" data-d="2">
            {sintomas.map(([n, titulo, texto]) => (
              <li key={n}>
                <span className="n">{n}</span>
                <div><h3>{titulo}</h3><p>{texto}</p></div>
              </li>
            ))}
          </ol>
        </div>

        <blockquote className="bloque-cita bloque-cita--ancha u-mt-7 reveal">
          {t('taller.suena.cita')}
        </blockquote>
      </div>
    </Seccion>
  );
}
