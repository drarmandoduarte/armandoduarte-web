import { useTranslation } from 'react-i18next';
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
 * ── La fotografía vuelve a ser el fondo, y esta vez sin velo (orden #12, C) ─
 * Es el tercer lugar donde vive esta foto, así que conviene el relato entero:
 *
 *   · **#05** — fondo de toda la sección con un velo crema. Al 88 % daba **14
 *     pares bajo AA** —medido sobre el píxel dibujado— y hubo que subirlo a
 *     94 %, donde la foto ya no es una imagen sino una textura. El problema no
 *     era el velo: era que encima había ocho bloques de texto chico, y cada uno
 *     necesita 4,5:1 contra lo que tenga detrás.
 *   · **#07** — se la movió a la tarjeta de la cita, donde el único texto encima
 *     es una frase de 30 px en crema. Ahí la foto se ve, porque aguanta mucho
 *     menos velo.
 *   · **#12** — Lucía la quiere otra vez de fondo de la sección, entera. Se hace
 *     (D23), y lo que cambia es **cómo se resuelve el contraste**: ya no con un
 *     velo uniforme —que es lo que se midió y no funciona— sino dándole al texto
 *     su propio suelo. El bloque de texto va sobre un panel de crema opaco al
 *     92 % con desenfoque, en la columna izquierda; la foto se ve entera a la
 *     derecha y por debajo. Es lo que 512 hace con su hero: la imagen es fondo,
 *     el texto tiene piso.
 *
 * Y la tarjeta de la cita vuelve a ser cálida sin foto, como era antes de la #07.
 *
 * ── Por qué la foto empieza DEBAJO de la franja de hechos ────────────────
 * Porque la franja es lo único de esta sección que sigue siendo texto chico
 * suelto: rótulos de 11 px en `--gris` y valores de 17–21 px, sin panel. Ponerla
 * sobre la fotografía sería repetir exacto el defecto que la #05 pagó con 14
 * pares bajo AA, y la orden #12 nombra la franja y «¿Te suena?» como dos cosas
 * distintas (su sección A habla de «la franja de tres hechos»; la C, de «la
 * sección "¿Te suena?"»). Así que la foto es el fondo de «¿Te suena?», a sangre
 * de lado a lado, desde la hairline de la franja hasta el final de la sección.
 * **Queda declarado en el informe de la #12 como la lectura que se eligió.**
 */
export function Suena() {
  const { t } = useTranslation();
  const sintomas = [
    ['01', t('taller.suena.unoTitulo'), t('taller.suena.unoTexto')],
    ['02', t('taller.suena.dosTitulo'), t('taller.suena.dosTexto')],
    ['03', t('taller.suena.tresTitulo'), t('taller.suena.tresTexto')],
  ];
  return (
    <Seccion id="suena" tono="blanco" contenedor={false}>
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
            <span>{t('taller.hechos.dondeClave')}</span><b>{t('taller.hechos.dondeValor')}</b>
          </div>
          <div>
            <Icono nombre="sesion" ancho={40} alto={40} />
            <span>{t('taller.hechos.modalidadClave')}</span><b>{t('taller.hechos.modalidadValor')}</b>
          </div>
        </div>
      </div>

      {/* `con-fondo` es lo que hace que `check/contraste.mjs` mida el píxel
          realmente dibujado detrás de cada línea en vez del color declarado: sin
          esa clase el barrido sube por los padres, encuentra el blanco de la
          sección e informa un contraste que no existe, porque entre ese blanco y
          el texto hay una fotografía. */}
      <div className="suena-fondo con-fondo">
        <div className="fondo-foto fondo-foto--sin-velo">
          <img
            src="img/fotos/porque-fondo.webp"
            width={1200}
            height={1800}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        </div>
        <div className="container suena-fondo__grid">
          <div className="suena__panel reveal">
            <span className="eyebrow">{t('taller.suena.eyebrow')}</span>
            <h2 className="display-m u-mt-4">
              {t('taller.suena.titulo1')}<br /><span className="suave">{t('taller.suena.titulo2')}</span>
            </h2>
            <p className="body u-mt-4">{t('taller.suena.cuerpo')}</p>
            <ol className="lista lista--2">
              {sintomas.map(([n, titulo, texto]) => (
                <li key={n}>
                  <span className="n">{n}</span>
                  <div><h3>{titulo}</h3><p>{texto}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <blockquote className="bloque-cita u-mt-7 reveal">
            {t('taller.suena.cita')}
          </blockquote>
        </div>
      </div>
    </Seccion>
  );
}
