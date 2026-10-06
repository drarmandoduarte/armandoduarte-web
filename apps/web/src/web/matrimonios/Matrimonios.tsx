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
 *
 * ── El gancho primero (orden #39, 3; pedido de Armando, D23) ─────────────
 * Lo primero que se lee después del hero son las preguntas y el dolor; lo
 * descriptivo va más abajo. La banda de hechos baja de debajo del hero a
 * después del giro, antes de las fortalezas. Un solo orden en todos los anchos
 * y en el DOM (sin `order` de CSS): el lector de pantalla lee lo mismo que el
 * ojo. «Ver el programa ↓» sigue yendo a `#programa`.
 */
export function Matrimonios() {
  const { t } = useTranslation();
  return (
    <Marco pagina="matrimonios" mensaje={t(CLAVE_MENSAJE_MATRIMONIOS)}>
      <Hero />
      <Mirarse />
      <Dolor />
      <Giro />
      <Hechos />
      <Fortalezas />
      <Frases />
      <Facilitador />
      <Cierre />
    </Marco>
  );
}
