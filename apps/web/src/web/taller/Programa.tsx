import { useTranslation } from 'react-i18next';
import { Glifo } from '../comun/Glifo';
import { Seccion } from '../comun/Seccion';

/**
 * Los cinco núcleos.
 *
 * ── Una sección de dos, desde la #20-bis ─────────────────────────────────
 * Hasta la #20 esta sección traía también «Lo que te llevas» y medía 1738 px
 * contra una pantalla de 900. Dirección la partió (#20, A.5): «Lo que te llevas»
 * es `Llevas.tsx`, su propia sección, y acá quedan los núcleos. El ancla
 * `#programa` del hero sigue cayendo acá, que es donde empieza el programa.
 *
 * ── Como «Cuatro etapas» de 512, desde la #23 (D) ───────────────────────
 * La grilla «3 + 2» de la #20-bis era para que la sección entrara en una
 * pantalla; la #23 acotó esa regla, y los núcleos pasan a **una fila de cinco**
 * con la línea de tiempo arriba, medida sobre 512.com.uy. Debajo de 1100 px, la
 * misma línea en vertical. Las medidas, en `index.css` («Núcleos»).
 *
 * ── De cuatro a cinco, y de dos párrafos a uno (orden #12, G) ────────────
 * Armando mandó el 28/9 el modelo entero —«Modelo orientado a la madurez»— con
 * **una línea por núcleo**. Los dos párrafos de antes eran de la #01 y estaban
 * escritos por la casa; el segundo de cada núcleo no tiene equivalente en lo
 * que Armando escribió, y **lo que Armando no escribió no se pone**. Así que la
 * clave pasa de `texto1`/`texto2` a un solo `texto`, que es lo que hay.
 */
export function Programa() {
  const { t } = useTranslation();
  /* El tercer valor es el ícono. Los cuatro primeros son los PNG de Lucía; el
     quinto, `cambios.svg`, llegó con los insumos de la #12 en el mismo estilo.
     Desde la #23 (D) se dibuja solo el glifo, en teal (`Glifo.tsx`). */
  const nucleos = [
    ['01', 'uno', 'cerebro'],
    ['02', 'dos', 'emociones'],
    ['03', 'tres', 'comunicacion'],
    ['04', 'cuatro', 'victorias'],
    ['05', 'cinco', 'cambios'],
  ] as const;

  return (
    <Seccion id="programa">
      <span className="eyebrow reveal">{t('taller.programa.eyebrow')}</span>
      <h2 className="display-l u-mt-4 reveal" data-d="1">
        {t('taller.programa.titulo1')}<br /><span className="suave">{t('taller.programa.titulo2')}</span>
      </h2>
      {/* La línea de tiempo de «Cuatro etapas» de 512 (#23, D): círculo con el
          glifo, la línea al siguiente, y debajo título y texto. Sin la línea
          «01»: con «NÚCLEO 1» eran dos numeraciones seguidas, y el nombre que
          usa Armando es el segundo (auditoría del PR #35). */}
      <ol className="nucleos">
        {/* Cada núcleo entra 120 ms después del anterior (#28): el retraso
            vive en `index.css` («El movimiento de 512»), no en `data-d`. */}
        {nucleos.map(([n, clave, icono]) => (
          <li className="nucleo reveal" key={n}>
            <span className="nucleo__circulo"><Glifo nombre={icono} lado={20} /></span>
            <span className="nucleo__linea" aria-hidden="true" />
            <h3><b>{t(`taller.programa.${clave}.rotulo`)}</b>{t(`taller.programa.${clave}.titulo`)}</h3>
            <p>{t(`taller.programa.${clave}.texto`)}</p>
          </li>
        ))}
      </ol>
      <p className="receso reveal">{t('taller.programa.receso')}</p>
    </Seccion>
  );
}
