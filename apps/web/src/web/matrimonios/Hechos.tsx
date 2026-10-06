import { useTranslation } from 'react-i18next';
import { Icono } from '../comun/Icono';

/**
 * La banda de hechos de `/matrimonios` (orden #38): la de `/merida` (#23 B),
 * sobre `--calido`, con los íconos de Lucía. No es oscura, así que no pasa a
 * terracota.
 *
 * Inicia, horario, modalidad y duración, en el orden de la orden. Los íconos
 * son los de la casa: el calendario, el reloj, la sesión (el mismo que
 * «Modalidad» en `/merida`) y el birrete de «Formación» para los seis meses.
 *
 * Desde la #39 (§3) no va debajo del hero sino después del giro, antes de las
 * fortalezas: lo descriptivo baja y el gancho sube. Queda entre el blanco del
 * giro y el crema de las fortalezas, así que el borde lo sigue poniendo el
 * cambio de color.
 */
export function Hechos() {
  const { t } = useTranslation();
  const celdas = [
    ['fecha', 'inicia'],
    ['horario', 'horario'],
    ['sesion', 'modalidad'],
    ['formacion', 'duracion'],
  ] as const;
  return (
    <section className="hechos-banda" id="hechos">
      <div className="container">
        <div className="hechos reveal">
          {celdas.map(([icono, clave]) => (
            <div key={clave}>
              <Icono nombre={icono} ancho={40} alto={40} />
              <span>{t(`matrimonios.hechos.${clave}Clave`)}</span><b>{t(`matrimonios.hechos.${clave}Valor`)}</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
