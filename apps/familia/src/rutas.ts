/**
 * Las rutas de Mi espacio, en un solo lugar.
 *
 * Son pocas y van a crecer con cada orden, así que se nombran en vez de
 * escribirse sueltas: el día que `/entrar` cambie de nombre, cambia acá y no en
 * los siete lugares que lo enlazan.
 */
export const RUTAS = {
  entrar: '/entrar',
  miEspacio: '/mi-espacio',
  /** El panel del equipo (orden #24 A). Solo `dueno` y `equipo`; a un cliente lo devuelve a Mi espacio. */
  equipo: '/equipo',
  /** «Me anoto» con un taller elegido: `/me-anoto/<slug>` (orden #24 B). El
   *  prefijo y cómo se lee el slug viven en `@codice/core` (`slugDeMeAnoto`). */
  meAnoto: '/me-anoto',
  /* Orden #29: la barra lateral. Inicio es `miEspacio`. */
  /** Los talleres abiertos y «Me anoto». */
  talleres: '/talleres',
  /** Mis inscripciones: estado y comprobante. */
  misTalleres: '/mis-talleres',
  /** «Tus datos»: la ficha y el perfil (#27 D). */
  misDatos: '/mis-datos',
  /** La primera entrada: nombre, apellido y WhatsApp antes de cualquier otra cosa (#29 C). */
  empezar: '/empezar',
} as const;

/**
 * Los lugares de Mi espacio que cualquiera con sesión puede tener en la barra
 * de direcciones (#29). `/equipo` también es un lugar, pero solo para el equipo,
 * y `/me-anoto/<slug>` se reconoce por su forma (`slugDeMeAnoto`).
 */
export const LUGARES_CON_SESION: readonly string[] = [RUTAS.miEspacio, RUTAS.talleres, RUTAS.misTalleres, RUTAS.misDatos];

/** A dónde va alguien que llega a `/` o a una ruta que no existe. */
export const RUTA_POR_DEFECTO = RUTAS.miEspacio;

/**
 * La web pública, adonde llevan el wordmark, «Volver a la web» y los enlaces
 * legales (orden #18, B.1 y B.9). Absoluta porque Mi espacio vive en otro
 * dominio: un `/privacidad` relativo caería en esta app, que no la tiene.
 */
export const WEB = 'https://armandoduarte.com';
