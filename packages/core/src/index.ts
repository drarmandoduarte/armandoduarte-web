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
  CLAVE_MENSAJE_RESERVA,
  enlaceReservaDelTaller,
} from './web/contacto';
// La puerta desde la web a Mi espacio (orden #25).
export {
  APP_FAMILIA, SLUG_DEL_TALLER_DE_MERIDA, RUTA_RESERVAR_MERIDA, baseDeLaApp, enlaceAMiEspacio,
} from './web/mi-espacio';

// ── El panel del equipo (orden #24 A) ────────────────────────────────────────
export {
  esZonaValida, instanteDesdeHoraDePared, horaDeParedDe, fechaLarga, fechaCorta, horaCorta, ciudadDeZona,
} from './panel/zonas';
export {
  ESTADOS_DE_CURSO, MODALIDADES, ESTADOS_DE_EDICION, ZONA_POR_DEFECTO, MONEDA_POR_DEFECTO,
  PATRON_DE_SLUG, slugDesdeTitulo, validarCurso, cursoParaGuardar, validarEdicion,
  edicionParaGuardar, ocupacion, formatearPrecio,
} from './panel/cursos';
export type {
  EstadoDeCurso, Modalidad, EstadoDeEdicion, Errores, CursoEntrada, EdicionEntrada,
} from './panel/cursos';
export {
  normalizarParaBuscar, coincide, aCsv, nombreDeArchivo, telefonoParaWa, enlaceDeSaludo,
} from './panel/listas';
export { TERRITORIOS, accionDeEquipo, esTerritorio } from './panel/equipo';
export type { Territorio, Rol, FilaDePersona } from './panel/equipo';
