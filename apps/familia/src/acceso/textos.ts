import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Idioma, T } from '@moldes/idiomas';
import { tDelMolde } from '../molde/arranque';

/**
 * El `t` del molde para las pantallas de acceso — orden #37, PR 2 (fase-2 §5).
 *
 * Los textos `auth.*` son del molde (`@moldes/idiomas`, en es/en/pt, con los
 * plurales de «Te queda 1 intento»); los de Mi espacio entran como `extras`
 * (`familia.json`: hoy, los del rescate). El idioma es el que la persona eligió
 * en el selector de la entrada, que sigue viviendo en i18next hasta el PR 3:
 * por eso se lee de ahí y el `t` se rearma cuando cambia.
 */
export function useT(): { t: T; idioma: Idioma } {
  const { i18n } = useTranslation();
  const idioma = (['es', 'en', 'pt'].includes(i18n.resolvedLanguage ?? '') ? i18n.resolvedLanguage : 'es') as Idioma;
  const t = useMemo(() => tDelMolde(idioma), [idioma]);
  return { t, idioma };
}

/**
 * La fecha y la hora de un vencimiento, en el idioma de la pantalla y en la hora
 * del aparato. En 24 horas: en es-MX la de 12 termina en «p.m.», y los textos
 * que la llevan al final de la frase quedaban con dos puntos («p.m..»).
 */
export function fechaDeVencimiento(vence: Date, idioma: Idioma): string {
  return new Intl.DateTimeFormat(idioma === 'es' ? 'es-MX' : idioma === 'pt' ? 'pt-BR' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(vence);
}
