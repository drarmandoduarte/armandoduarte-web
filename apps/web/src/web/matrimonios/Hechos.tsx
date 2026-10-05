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
