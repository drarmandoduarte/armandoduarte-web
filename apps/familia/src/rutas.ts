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
} as const;

/** A dónde va alguien que llega a `/` o a una ruta que no existe. */
export const RUTA_POR_DEFECTO = RUTAS.miEspacio;

/**
 * La web pública, adonde llevan el wordmark, «Volver a la web» y los enlaces
 * legales (orden #18, B.1 y B.9). Absoluta porque Mi espacio vive en otro
 * dominio: un `/privacidad` relativo caería en esta app, que no la tiene.
 */
export const WEB = 'https://armandoduarte.com';
