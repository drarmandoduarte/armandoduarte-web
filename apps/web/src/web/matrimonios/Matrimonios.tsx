import { useTranslation } from 'react-i18next';
import { CLAVE_MENSAJE_MATRIMONIOS } from '@codice/core';
import { Marco } from '../comun/Marco';
import { Hero } from './Hero';
import { Hechos } from './Hechos';
import { Mirarse } from './Mirarse';
import { Dolor } from './Dolor';
import { Giro } from './Giro';
import { Fortalezas } from './Fortalezas';
import { Frases } from './Frases';
import { Facilitador } from './Facilitador';
import { Cierre } from './Cierre';

/**
 * La landing del taller «Cómo sanar un matrimonio herido» — orden #38.
 *
 * Misma casa que `/merida`: el mismo hero, la banda de hechos, la sección con
 * foto de fondo, los núcleos, el facilitador y el cierre. Lo que cambia es el
 * contenido —literal del `.docx` de Armando—, las fotos —dolor arriba,
 * esperanza abajo— y el color de las secciones oscuras: la terracota del
 * póster en lugar del teal.
 *
 * Se reserva por WhatsApp (la bandera de Mi espacio sigue apagada): el número
 * de México en la cabecera, el menú, el pie y los botones principales; el de
 * otros países en «Desde otro país» del cierre.
 */
export function Matrimonios() {
  const { t } = useTranslation();
  return (
    <Marco pagina="matrimonios" mensaje={t(CLAVE_MENSAJE_MATRIMONIOS)}>
      <Hero />
      <Hechos />
      <Mirarse />
      <Dolor />
      <Giro />
      <Fortalezas />
      <Frases />
      <Facilitador />
      <Cierre />
    </Marco>
  );
}
