/**
 * Los canales públicos de Armando. Están acá por lo mismo que el teléfono está
 * en `@codice/core`: el de YouTube aparece tres veces entre las cuatro páginas y
 * el de Spotify otras tres. Una URL repetida seis veces es una URL que un día
 * se actualiza cinco.
 *
 * Instagram **no está**, y es a propósito: Armando no dio cuenta, y la orden
 * web #02 sacó el enlace de todas las páginas en vez de dejarlo apuntando a `#`.
 * Cuando exista, es una línea acá.
 */
export const CANALES = {
  youtube: 'https://www.youtube.com/c/DrArmandoDuarte',
  spotify: 'https://open.spotify.com/show/33wHQaX2OFU2PkZxFSs9e7',
  facebook: 'https://www.facebook.com/armandoduartepantoja',
  sanPablo: 'https://sanpablo.com.mx/producto/construyendo-familias-fuertes-san-pablo/',
  politicaWhatsApp: 'https://www.whatsapp.com/legal/privacy-policy',
} as const;
