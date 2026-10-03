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
  /** «Tus datos» hasta la #33. Desde la #34 es Ajustes → Perfil: `/mis-datos`
   *  responde 308 hacia allá (`vercel.json`) y, si se llega sin recargar,
   *  `rutaQueCorresponde()` la corrige. Se nombra para poder redirigirla. */
  misDatos: '/mis-datos',
  /** «Tus preferencias.» (#34 B). `/ajustes` a secas va a Perfil. */
  ajustes: '/ajustes',
  ajustesPerfil: '/ajustes/perfil',
  ajustesCuenta: '/ajustes/cuenta',
  ajustesNotificaciones: '/ajustes/notificaciones',
  /** Solo para el equipo (B.4): a un cliente lo devuelve a Inicio. */
  ajustesSeguridad: '/ajustes/seguridad',
  ajustesSesiones: '/ajustes/sesiones',
  ajustesPrivacidad: '/ajustes/privacidad',
  /** La primera entrada: nombre, apellido y WhatsApp antes de cualquier otra cosa (#29 C). */
  empezar: '/empezar',
} as const;

/**
 * Los lugares de Mi espacio que cualquiera con sesión puede tener en la barra
 * de direcciones (#29). `/equipo` también es un lugar, pero solo para el equipo,
 * y `/me-anoto/<slug>` se reconoce por su forma (`slugDeMeAnoto`).
 */
export const LUGARES_CON_SESION: readonly string[] = [
  RUTAS.miEspacio, RUTAS.talleres, RUTAS.misTalleres,
  /* #34 B: las secciones de Ajustes. Seguridad no: es del equipo, como `/equipo`. */
  RUTAS.ajustesPerfil, RUTAS.ajustesCuenta, RUTAS.ajustesNotificaciones, RUTAS.ajustesSesiones, RUTAS.ajustesPrivacidad,
];

/** La ruta de cada sección de «Tus preferencias.» (#34 B), en el orden de `SECCIONES_DE_AJUSTES`. */
export const RUTA_DE_SECCION = {
  perfil: RUTAS.ajustesPerfil,
  cuenta: RUTAS.ajustesCuenta,
  notificaciones: RUTAS.ajustesNotificaciones,
  seguridad: RUTAS.ajustesSeguridad,
  sesiones: RUTAS.ajustesSesiones,
  privacidad: RUTAS.ajustesPrivacidad,
} as const;

/** A dónde va alguien que llega a `/` o a una ruta que no existe. */
export const RUTA_POR_DEFECTO = RUTAS.miEspacio;

/**
 * La web pública, adonde llevan el wordmark de `/entrar`, su «Volver a la web»
 * y los enlaces legales (orden #18, B.1 y B.9). Adentro de Mi espacio ya no hay
 * salida a la web (#34 A.1). Absoluta porque Mi espacio vive en otro
 * dominio: un `/privacidad` relativo caería en esta app, que no la tiene.
 */
export const WEB = 'https://armandoduarte.com';
