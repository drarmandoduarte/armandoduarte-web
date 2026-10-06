/**
 * Las rutas de Mi espacio, en un solo lugar.
 *
 * Son pocas y van a crecer con cada orden, así que se nombran en vez de
 * escribirse sueltas: el día que `/entrar` cambie de nombre, cambia acá y no en
 * los siete lugares que lo enlazan.
 */
export const RUTAS = {
  /** Hasta la #34, la entrada. Desde la #35 es un 308 a `/login` (`vercel.json`), con su `?ir=`. */
  entrar: '/entrar',
  /* ── Las pantallas de acceso del guion v1 del Kit 512 (orden #35) ──
     Las direcciones son las del guion (§4). Siguen siendo ESTADOS de la sesión
     y no lugares (ver `App.tsx`): la URL acompaña a la decisión del núcleo,
     nunca al revés — escribir `/auth/2fa` a mano no salta ningún paso. */
  /** P1 · Entrada. */
  login: '/login',
  /** P2 · Código por mail. */
  loginCodigo: '/login/codigo',
  /** P3 · Verificación del autenticador. */
  reto: '/auth/2fa',
  /** P4 · Activar el autenticador (equipo). */
  activar: '/auth/2fa/activar',
  /** P5 · Códigos de respaldo. */
  respaldo: '/auth/2fa/respaldo',
  /** P6 · Recuperación con un código de respaldo. */
  recuperar: '/auth/2fa/recuperar',
  /** P6b · Reseteo con espera (rescate solo). El guion no le da dirección; ésta es la de la casa. */
  reseteo: '/auth/2fa/reseteo',
  /** Los enlaces de los correos del rescate (#37 PR 2): confirmar o cancelar. Con o sin sesión.
   *  La escribe `RUTA_DEL_RESCATE` de `@codice/core`, que es la que arma los enlaces. */
  rescate: '/rescate',
  /** Inicio (`<Inicio>` del molde, #37 PR 3). */
  miEspacio: '/mi-espacio',
  /** El panel del equipo (orden #24 A). Solo `dueno` y `equipo`; a un cliente lo devuelve a Mi espacio. */
  equipo: '/equipo',
  /** «Me anoto» con un taller elegido: `/me-anoto/<slug>` (orden #24 B). El
   *  prefijo y cómo se lee el slug viven en `@codice/core` (`slugDeMeAnoto`). */
  meAnoto: '/me-anoto',
  /** Los talleres abiertos y «Me anoto». */
  talleres: '/talleres',
  /** Mis inscripciones: estado y comprobante. */
  misTalleres: '/mis-talleres',
  /* ── Lo que trae el molde (orden #37, PR 3 · §9) ── */
  /** El Centro de alertas. */
  alertas: '/alertas',
  /** La Papelera. Del equipo; a un cliente se le muestra vacía (no borra nada). */
  papelera: '/papelera',
  /** La pantalla Equipo del molde: solo el dueño. `/equipo` sigue siendo el panel. */
  equipoPersonas: '/equipo/personas',
  /** `<Ajustes>` del molde. La sección va en `?s=` (`/ajustes?s=cuenta`). */
  ajustes: '/ajustes',
  /** La primera entrada (`<Bienvenida>` del molde): reemplaza a `/empezar`. */
  bienvenida: '/bienvenida',
  /* ── Las que ya no son lugares: 308 en `vercel.json` y, si se llega sin
     recargar, `rutaQueCorresponde()` las corrige ── */
  /** «Tus datos» hasta la #33 → Ajustes → Perfil. */
  misDatos: '/mis-datos',
  /** La primera entrada de la #29 → `/bienvenida`. */
  empezar: '/empezar',
} as const;

/**
 * Las secciones de «Tus preferencias.» de la #34 eran rutas
 * (`/ajustes/perfil`…). Desde el molde son `?s=`: `/ajustes/<id>` → `/ajustes?s=<id>`,
 * y el `alias` del adaptador lleva `seguridad` y `sesiones` a «Cuenta y seguridad».
 */
export const SECCIONES_VIEJAS = ['perfil', 'cuenta', 'notificaciones', 'seguridad', 'sesiones', 'privacidad'] as const;

/** `/ajustes/perfil` → `perfil`; cualquier otra cosa, `null`. */
export function seccionVieja(ruta: string): string | null {
  const m = /^\/ajustes\/([a-z]+)$/.exec(ruta);
  return m && (SECCIONES_VIEJAS as readonly string[]).includes(m[1]) ? m[1] : null;
}

/** `/ajustes?s=<id>` (o `/ajustes` a secas). */
export const rutaDeAjustes = (seccion?: string | null) => (seccion ? `${RUTAS.ajustes}?s=${encodeURIComponent(seccion)}` : RUTAS.ajustes);

/**
 * Los lugares de Mi espacio que cualquiera con sesión puede tener en la barra
 * de direcciones (#29). `/equipo` y `/equipo/personas` también son lugares,
 * pero solo para el equipo y el dueño, y `/me-anoto/<slug>` se reconoce por su
 * forma (`slugDeMeAnoto`).
 */
export const LUGARES_CON_SESION: readonly string[] = [
  RUTAS.miEspacio, RUTAS.talleres, RUTAS.misTalleres, RUTAS.alertas, RUTAS.papelera, RUTAS.ajustes,
];

/**
 * Cada lugar del shell del molde (`onIr(id)`) y su ruta. `perfil` es el avatar
 * de la barra: abre Ajustes → Perfil.
 */
export const RUTA_DE_LUGAR = {
  inicio: RUTAS.miEspacio,
  talleres: RUTAS.talleres,
  misTalleres: RUTAS.misTalleres,
  panel: RUTAS.equipo,
  alertas: RUTAS.alertas,
  papelera: RUTAS.papelera,
  equipo: RUTAS.equipoPersonas,
  ajustes: RUTAS.ajustes,
  perfil: rutaDeAjustes('perfil'),
} as const;
export type Lugar = keyof typeof RUTA_DE_LUGAR;

/** El lugar activo del shell para una ruta. `/me-anoto/<slug>` es Talleres. */
export function lugarDeRuta(ruta: string): Lugar {
  if (ruta.startsWith(`${RUTAS.meAnoto}/`)) return 'talleres';
  if (ruta === RUTAS.equipoPersonas) return 'equipo';
  if (ruta === RUTAS.equipo) return 'panel';
  if (ruta.startsWith(RUTAS.ajustes)) return 'ajustes';
  const par = (Object.entries(RUTA_DE_LUGAR) as Array<[Lugar, string]>).find(([, r]) => r === ruta);
  return par ? par[0] : 'inicio';
}

/** A dónde va alguien que llega a `/` o a una ruta que no existe. */
export const RUTA_POR_DEFECTO = RUTAS.miEspacio;

/**
 * La web pública, adonde llevan el wordmark de `/entrar`, su «Volver a la web»
 * y los enlaces legales (orden #18, B.1 y B.9). Adentro de Mi espacio ya no hay
 * salida a la web (#34 A.1). Absoluta porque Mi espacio vive en otro
 * dominio: un `/privacidad` relativo caería en esta app, que no la tiene.
 */
export const WEB = 'https://armandoduarte.com';
