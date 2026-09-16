// @codice/core — tipos, contratos e i18n compartidos.
//
// La regla de la casa, heredada de Omnia y escrita en el README: **ninguna
// regla de negocio fuera de este paquete, y con test. Las pantallas solo
// muestran.** Existe porque la app nativa va a reusar `core` entero: lo que
// hoy se escriba dentro de un `.tsx` es lógica que mañana hay que escribir dos
// veces.
//
// En la orden #01 no hay ninguna regla de negocio todavía: la web pública es
// texto y presentación. Lo único que vive acá es el idioma y el contacto.

export { RECURSOS_I18N, IDIOMAS } from './i18n/recursos';
export type { Idioma } from './i18n/recursos';
export {
  TELEFONO_GABY,
  TELEFONO_GABY_VISIBLE,
  TELEFONO_TALLER,
  TELEFONO_TALLER_VISIBLE,
  CONTACTO_DE_PAGINA,
  enlaceWhatsApp,
} from './web/contacto';
