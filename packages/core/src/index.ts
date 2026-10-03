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
// La puerta desde la web a Mi espacio (orden #25), y sus banderas (orden #33).
export {
  APP_FAMILIA, MI_ESPACIO_EN_LA_WEB, SPOTIFY_EN_LA_WEB, SLUG_DEL_TALLER_DE_MERIDA, RUTA_RESERVAR_MERIDA, baseDeLaApp, enlaceAMiEspacio,
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

// ── Mi espacio: «Me anoto» (orden #24 B) ─────────────────────────────────────
export {
  rutaInternaSegura, PREFIJO_ME_ANOTO, slugDeMeAnoto, DATOS_PARA_ANOTARSE, datosQueFaltan,
  validarDatosParaAnotarse, datosParaEnviar, UMBRAL_DE_LUGARES, estadoDelTaller, fechasDelTaller,
  edicionElegida, edicionPrincipal, ESTADOS_DE_INSCRIPCION, claveDeEstado, enlaceParaPedirLosDatosDeCobro,
} from './mi-espacio/me-anoto';
export type { DatoParaAnotarse, DatosParaAnotarse, EstadoDelTaller } from './mi-espacio/me-anoto';

// ── El comprobante de pago (orden #27 C) ─────────────────────────────────────
export {
  TIPOS_DE_COMPROBANTE, TOPE_DE_COMPROBANTE, ACEPTA_COMPROBANTE, validarArchivoDeComprobante, rutaDeComprobante,
  fechaDeHoyEn, montoDesdeTexto, validarDeclaracion, declaracionParaEnviar, puedeDeclarar, principalDeMiEspacio,
} from './mi-espacio/comprobante';
export type { TipoDeComprobante, DeclaracionEntrada, CampoDeDeclaracion } from './mi-espacio/comprobante';
export {
  FILTROS_DE_INSCRIPTOS, filtrarPorEstado, filtroInicial, accionesDePago, MOTIVO_MAXIMO, validarResolucion, tonoDeEstado,
} from './panel/pagos';
export type { FiltroDeInscriptos, AccionesDePago } from './panel/pagos';

// ── El perfil del cliente (orden #27 D) ──────────────────────────────────────
export {
  PAISES_LATAM, PAISES_ISO, esPais, paisesParaElegir, NIVELES_EDUCATIVOS, ANIO_MINIMO, anioMaximo, edadDesdeAnio,
  validarPerfil, perfilParaEnviar, perfilIncompleto,
} from './mi-espacio/perfil';
export type { NivelEducativo, PerfilEntrada, CampoDelPerfil } from './mi-espacio/perfil';
export {
  DATOS_DE_LA_FICHA,
  edicionesVigentes,
  empezarParaEnviar,
  validarEmpezar,
  faltanEnLaFicha,
  necesitaEmpezar,
  proximoTaller,
} from './mi-espacio/marco';
export type { DatoDeLaFicha, EmpezarEntrada, CampoDeEmpezar } from './mi-espacio/marco';
export {
  PAIS_DEL_WHATSAPP,
  armarWhatsapp,
  ejemploNacional,
  formatearWhatsapp,
  nacionalMientrasSeEscribe,
  partirWhatsapp,
  prefijoDe,
  tienePrefijo,
  whatsappE164,
  whatsappValido,
} from './mi-espacio/whatsapp';

// ── La barra y los ajustes (orden #34) ───────────────────────────────────────
export {
  FORMAS_DE_ENTRAR, SECCIONES_DE_AJUSTES, claveDelRol, formasDeEntrar, inicialesDe, nombreDelBloque, seccionesDeAjustes,
} from './mi-espacio/ajustes';
export type { FormaDeEntrar, SeccionDeAjustes } from './mi-espacio/ajustes';
