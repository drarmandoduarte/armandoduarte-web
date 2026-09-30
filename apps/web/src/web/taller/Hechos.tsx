import { useTranslation } from 'react-i18next';
import { CANALES } from '../comun/canales';
import { Icono } from '../comun/Icono';

/**
 * La franja de hechos del taller: fecha, horario, dónde y modalidad.
 *
 * ── Banda propia desde la #23 (B) ────────────────────────────────────────
 * Hasta la #23 vivía adentro de «¿Te suena?», arriba de todo, y la sección
 * arrancaba pegada al hero: la franja quedaba a 73 px del hero y la foto del
 * chico tocaba el traje de Armando. Ahora es lo que «AHORA» es en la portada:
 * una banda entre el hero y la primera sección, con su mismo alto y ritmo,
 * sobre `--calido` y sin foto. Íconos teal, etiquetas en tinta. «¿Te suena?»
 * arranca después, con su aire y con la foto de Lucía solo adentro.
 *
 * Con `.reveal`, como «AHORA».
 *
 * ── La franja volvió a cuatro celdas (orden #12, A) ──────────────────────
 * El «Cuándo» se había eliminado en la #02 porque no había fecha, y `.hechos`
 * pasó a tres columnas en el mismo cambio, con una nota que decía: «cuando
 * Armando dé la fecha, vuelve la celda y el CSS vuelve a cuatro». Armando la dio
 * el 28/9. Volvió la celda, volvió el CSS, y el ícono del calendario es el
 * único que esta orden dibujó — en el estilo de los otros tres: círculo de
 * `--teal-medio`, glifo blanco de trazo 5, sobre el mismo lienzo de 96.
 */
export function Hechos() {
  const { t } = useTranslation();
  return (
    <section className="hechos-banda" id="hechos">
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
      </div>
    </section>
  );
}
