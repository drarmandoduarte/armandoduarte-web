import { enlaceWhatsApp } from '@codice/core';
import { IconoWhatsApp } from './IconoWhatsApp';

/**
 * El botón que abre WhatsApp con el mensaje ya escrito.
 *
 * El mensaje llega como texto —de i18n, nunca escrito acá— y el número, desde la
 * orden #05, **también llega como prop**. Antes lo sacaba solo de `@codice/core`,
 * cuando había uno solo; ahora son dos —el de Gaby en la portada, el de Mérida
 * en el taller— y un botón que eligiera por su cuenta sería un botón que un día
 * elige mal. Quien lo pone sabe en qué página está; este componente, no.
 *
 * Son ocho botones en las cuatro páginas y cada uno dice algo distinto según
 * dónde está: el del hero del taller dice que quiere reservar, el del pie solo
 * saluda. Esa diferencia es de Armando y se porta tal cual.
 */
export function BotonWhatsApp({
  telefono,
  mensaje,
  texto,
  clase = 'btn',
}: {
  telefono: string;
  mensaje: string;
  texto: string;
  clase?: string;
}) {
  return (
    <a href={enlaceWhatsApp(telefono, mensaje)} className={clase} target="_blank" rel="noopener">
      <IconoWhatsApp /> {texto}
    </a>
  );
}
