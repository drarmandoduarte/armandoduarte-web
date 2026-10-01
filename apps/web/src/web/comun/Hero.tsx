import type { ReactNode } from 'react';
import { FotoArco } from './FotoArco';
import { Retrato } from './Retrato';

/**
 * El hero de la casa: uno solo para la portada y para el taller (orden #23, A).
 *
 * ── Por qué uno y no dos ─────────────────────────────────────────────────
 * Hasta la #23 cada página tenía el suyo, y se fueron separando de a una orden:
 * la #16 le dio al del taller otras columnas (1,32fr/0,68fr) para que «El arte
 * de amar a tu» entrara en un renglón, y con eso el arco del taller quedó en
 * 424 × 530 arrancando a 371 px, contra 520 × 650 a 257 en la portada. Dirección
 * lo vio en producción: «los dos héroes no son iguales». Con un componente, lo
 * que puede cambiar entre páginas es lo que se le pasa —textos, botones, la
 * línea de datos— y lo que no puede cambiar —arco, columnas, título— no se le
 * puede pasar. Lo vigila `e2e/heroes-iguales.spec.ts`, que compara las dos
 * cajas del arco.
 *
 * ── Lo que decide el CSS (`index.css`, «Hero») ────────────────────────────
 * El rótulo arranca a 72 px de la línea de la cabecera, el arco a 48 y llega al
 * borde de abajo del hero, con el ancho que le da su `aspect-ratio` de 4/5.
 *
 * ── Se pinta en el primer cuadro (orden #07, D) ──────────────────────────
 * Nada de acá lleva `.reveal`. El fundido de entrada está bien para lo que hay
 * que bajar a buscar, pero aplicado a lo primero que se ve hace que la página
 * aparezca lavada y se arme de a pedazos durante medio segundo — y el h1, que
 * es el LCP, espera al `IntersectionObserver` para existir.
 */
export function Hero({
  rotulo,
  titulo,
  bajada,
  botones,
  datos,
  debajo,
  fotoAlt,
}: {
  /** El contenido del `.eyebrow`: texto, o ícono y texto. */
  rotulo: ReactNode;
  /** El contenido del `h1`. El tamaño es el mismo en las dos páginas. */
  titulo: ReactNode;
  bajada: string;
  botones: ReactNode;
  /** La línea de datos de abajo, separados por «·». */
  datos: string[];
  /** Un enlace de texto debajo de la línea de datos (#25: «Ver el programa ↓»
   *  en `/merida`). No es un botón: no compite con los de arriba. */
  debajo?: ReactNode;
  fotoAlt: string;
}) {
  return (
    <section className="hero" id="inicio">
      <div className="container hero__grid">
        <div className="hero__texto">
          <span className="eyebrow eyebrow--icono">{rotulo}</span>
          <h1 className="display-xl u-mt-4">{titulo}</h1>
          <p className="hero-sub">{bajada}</p>
          <div className="hero-cta">{botones}</div>
          <p className="hero-micro">
            {datos.map((d) => <span key={d}>{d}</span>)}
          </p>
          {debajo}
        </div>
        <FotoArco clase="foto foto--arco">
          <Retrato
            cual="medio-cuerpo"
            alt={fotoAlt}
            tamanos="(max-width:900px) 420px, 780px"
            prioridad
          />
        </FotoArco>
      </div>
    </section>
  );
}
