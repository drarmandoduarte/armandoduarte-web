import { enlaceWhatsApp } from '@codice/core';
import { IconoWhatsApp } from './IconoWhatsApp';

/**
 * El botón que abre WhatsApp con el mensaje ya escrito.
 *
 * El mensaje llega como texto —de i18n, nunca escrito acá— y el número sale de
 * `@codice/core`. Son ocho botones en las cuatro páginas y cada uno dice algo
 * distinto según dónde está: el del hero del taller dice que quiere reservar, el
 * del pie solo saluda. Esa diferencia es de Armando y se porta tal cual.
 */
export function BotonWhatsApp({
  mensaje,
  texto,
  clase = 'btn',
}: {
  mensaje: string;
  texto: string;
  clase?: string;
}) {
  return (
    <a href={enlaceWhatsApp(mensaje)} className={clase} target="_blank" rel="noopener">
      <IconoWhatsApp /> {texto}
    </a>
  );
}
