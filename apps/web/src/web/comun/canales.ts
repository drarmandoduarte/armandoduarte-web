/**
 * Los canales públicos de Armando. Están acá por lo mismo que el teléfono está
 * en `@codice/core`: el de YouTube aparece tres veces entre las cuatro páginas y
 * el de Spotify otras tres. Una URL repetida seis veces es una URL que un día
 * se actualiza cinco.
 *
 * Instagram entró en la #07: dirección verificó `@dr.armandoduarte` el 17/9
 * —es el que figura en la descripción del podcast— y devuelve 200. Hasta
 * entonces no estaba a propósito: la #02 lo sacó de todas las páginas en vez de
 * dejarlo apuntando a `#`.
 */
export const CANALES = {
  youtube: 'https://www.youtube.com/c/DrArmandoDuarte',
  spotify: 'https://open.spotify.com/show/33wHQaX2OFU2PkZxFSs9e7',
  facebook: 'https://www.facebook.com/armandoduartepantoja',
  instagram: 'https://www.instagram.com/dr.armandoduarte/',
  sanPablo: 'https://sanpablo.com.mx/producto/construyendo-familias-fuertes-san-pablo/',
  politicaWhatsApp: 'https://www.whatsapp.com/legal/privacy-policy',
} as const;
