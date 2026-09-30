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
