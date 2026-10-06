import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Ajustes, CabeceraSeccion, leerNovedades, useGuardar, type ConfigDeAjustes, type PropsDePanel } from '@moldes/ajustes';
import { Bloque, Boton, Campo, Enlace, FilaAjuste, Selector } from '@moldes/ui';
import type { Idioma, T } from '@moldes/idiomas';
import type { Session } from '@supabase/supabase-js';
import {
  NIVELES_EDUCATIVOS, contextoDeAjustes, edadDesdeAnio, paisesParaElegir, perfilParaEnviar, validarPerfil,
  type CampoDelPerfil, type PerfilEntrada,
} from '@codice/core';
import { api, ErrorDeApi, type Yo } from '../comun/api';
import { CampoWhatsApp } from '../comun/CampoWhatsApp';
import { descargar } from '../equipo/descargar';
import { supabase } from '../supabase';
import { verificarTotp } from '../acceso/totp';
import { fechaDeVencimiento } from '../acceso/textos';
import { WEB } from '../rutas';
import { design } from './arranque';
import { guardarTamano, guardarTema, tamanoGuardado, temaGuardado, type TamanoDelTexto, type Tema } from './apariencia';
import changelog from '../../CHANGELOG-del-molde.md?raw';

/**
 * Ajustes de Mi espacio: `<Ajustes>` del molde con su adaptador (orden #37,
 * PR 3 · §6). Reemplaza a «Tus preferencias.» de la #34.
 *
 * ── `config`: qué tiene Mi espacio ──────────────────────────────────────
 *   · Las comunes que usa: Perfil, Cuenta y seguridad, Apariencia, Idioma,
 *     Notificaciones, Privacidad y datos y Acerca de. **Sin** Datos, Avisos ni
 *     Plan (Mi espacio no es una cuenta con datos propios ni cobra un plan),
 *     sin integraciones, sin asistente y sin copias de seguridad.
 *   · Una propia, **«Perfil del taller»**, para todos (`paraTodos`): apellido,
 *     WhatsApp (el campo de la #32), país, ciudad, año de nacimiento, nivel
 *     educativo y «¿Para qué pedimos esto?». El Perfil del molde trae solo el
 *     nombre.
 *   · `alias`: los ids de la #34 (`seguridad` y `sesiones` → Cuenta).
 *   · Acerca de: la versión y las Novedades del molde (su CHANGELOG).
 *
 * ── Lo que hace cada acción ─────────────────────────────────────────────
 * Cada una devuelve una promesa; si falla, la fila vuelve a lo de antes y
 * **avisarlo es de la app** (fase-2 §6): `alAvisar` muestra el cartel.
 *   · nombre, avisos por correo e idioma → `POST /api/yo`;
 *   · el correo no se cambia desde acá (es la llave de la cuenta): no se pasa
 *     `guardarCorreo`, y la explicación de la fila lo dice. El campo del molde
 *     sigue siendo editable aunque no haya acción (propuesta al molde: de solo
 *     lectura cuando la app no pasa la acción);
 *   · tema y tamaño → este aparato (`apariencia.ts`);
 *   · el autenticador (cliente) y el segundo → P4 (`alActivar`); generar
 *     códigos → `POST /api/respaldo/generar`, con P8 si pide paso reciente;
 *   · cerrar en todos → `salir('deliberada', 'global')`;
 *   · exportar → un archivo con `/api/yo` y `/api/talleres`, en el momento;
 *   · borrar la cuenta → la zona peligrosa del molde: la palabra y el código.
 *     Con autenticador, el del autenticador; sin él, el que le llega al correo
 *     al abrir la zona. Después, `POST /api/cuenta/borrar`.
 */

const ALIAS = { seguridad: 'cuenta', sesiones: 'cuenta' };

export interface AccionesDeLaApp {
  recargar: () => Promise<void>;
  alAvisar: (texto: string, tono?: 'success' | 'danger') => void;
  /** P4: activar el autenticador (cliente) o sumar un segundo (cualquiera). */
  alActivar: () => void;
  alRegenerar: (codigos: string[]) => void;
  alPedirPasoReciente: (accion: { reintentar: () => void; cancelar: () => void }) => void;
  alSalirDeTodo: () => Promise<void>;
  alBorrada: () => Promise<void>;
  cambiarIdioma: (idioma: Idioma) => Promise<void>;
}

/** El factor TOTP verificado de la sesión, si hay. */
export function autenticadorDe(sesion: Session | null): { id: string; desde: string } | null {
  const f = sesion?.user?.factors?.find((x) => x.factor_type === 'totp' && x.status === 'verified');
  return f ? { id: f.id, desde: f.created_at } : null;
}

export function PaginaDeAjustes({ t, yo, sesion, seccion, onSeccion, app }: {
  t: T;
  yo: Yo;
  sesion: Session | null;
  seccion: string | null;
  onSeccion: (id: string | null) => void;
  app: AccionesDeLaApp;
}) {
  const idioma = t.idioma as Idioma;
  const correo = sesion?.user?.email ?? null;
  const autenticador = autenticadorDe(sesion);
  const ctx = contextoDeAjustes(yo.rol);
  const [quedan, setQuedan] = useState<number | null>(null);
  const [tema, setTema] = useState<Tema>(temaGuardado);
  const [tamano, setTamano] = useState<TamanoDelTexto>(tamanoGuardado);

  useEffect(() => {
    if (!autenticador) return;
    let vivo = true;
    void api<{ quedan: number }>('respaldo/cuantos').then((r) => { if (vivo) setQuedan(r.quedan); }).catch(() => {});
    return () => { vivo = false; };
  }, [autenticador?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const novedades = useMemo(() => leerNovedades(changelog), []);
  const fechaCorta = (iso: string) => new Intl.DateTimeFormat(idioma === 'es' ? 'es-MX' : idioma === 'pt' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'numeric', year: 'numeric' }).format(new Date(iso));

  const config: ConfigDeAjustes = {
    comunes: ['perfil', 'cuenta', 'apariencia', 'idioma', 'notificaciones', 'privacidad', 'acerca'],
    propias: [{ id: 'taller', etiqueta: t('mi.ajustes.taller'), paraTodos: true, Panel: PanelDelTaller }],
    alias: ALIAS,
    canales: ['email'],
    version: novedades[0] ? { numero: novedades[0].version, fecha: novedades[0].fecha ?? '' } : undefined,
    novedades,
    enlaces: { terminos: `${WEB}/terminos`, privacidad: `${WEB}/privacidad` },
  };

  const persona = yo.persona;
  const valores = {
    perfil: { nombre: persona?.nombre ?? '' },
    correo,
    totp: { activo: Boolean(autenticador), fecha: autenticador ? fechaCorta(autenticador.desde) : undefined },
    respaldoQuedan: quedan ?? 10,
    aparatos: [{ id: 'este', nombre: t('mi.ajustes.esteAparato'), este: true }],
    reseteoPendiente: yo.reseteoPendiente ? { vence: fechaDeVencimiento(new Date(yo.reseteoPendiente.vence), idioma) } : null,
    tema,
    tamano,
    idioma,
    notificaciones: {
      tipos: [{ id: 'correo', nombre: t('mi.ajustes.avisos'), explicacion: t('mi.ajustes.avisos.d'), activo: persona?.avisos_por_correo !== false }],
      resumen: 'no',
      canal: 'email',
    },
    taller: { yo, app },
  };

  /** Una acción que guarda en la ficha: si falla, el cartel lo dice y la fila vuelve. */
  const guardarEnLaFicha = async (cuerpo: Record<string, unknown>) => {
    try {
      await api('yo', { metodo: 'POST', cuerpo });
      await app.recargar();
    } catch (e) {
      app.alAvisar(t('mi.ajustes.error'), 'danger');
      throw e;
    }
  };

  const generarRespaldo = async (): Promise<void> => {
    try {
      const r = await api<{ codigos: string[] }>('respaldo/generar', { metodo: 'POST' });
      app.alRegenerar(r.codigos);
    } catch (e) {
      if (e instanceof ErrorDeApi && e.codigo === 'PASO_RECIENTE_REQUERIDO') {
        app.alPedirPasoReciente({ reintentar: () => void generarRespaldo(), cancelar: () => {} });
        return;
      }
      app.alAvisar(t('mi.ajustes.error'), 'danger');
    }
  };

  const borrarCuenta = async (codigo?: string) => {
    if (!codigo) return;
    if (autenticador) {
      const r = await verificarTotp(codigo, autenticador.id);
      if (r !== 'ok') return app.alAvisar(t('mi.ajustes.borrar.codigoMal'), 'danger');
    } else {
      const { error } = await supabase.auth.verifyOtp({ email: correo ?? '', token: codigo, type: 'email' });
      if (error) return app.alAvisar(t('mi.ajustes.borrar.codigoMal'), 'danger');
    }
    try {
      await api('cuenta/borrar', { metodo: 'POST' });
    } catch (e) {
      const unico = e instanceof ErrorDeApi && e.codigoDelServidor === 'UNICO_DUENO';
      return app.alAvisar(t(unico ? 'mi.ajustes.borrar.unicoDueno' : 'mi.ajustes.borrar.error'), 'danger');
    }
    await app.alBorrada();
  };

  const acciones = {
    guardarNombre: (nombre: string) => guardarEnLaFicha({ nombre }),
    /* Lo que la fila no tiene que ofrecer, no se pasa: una fila sin acción no dibuja botón. */
    ...(autenticador
      ? { sumarAutenticador: app.alActivar, generarRespaldo: () => void generarRespaldo() }
      : { activarAutenticador: app.alActivar }),
    cerrarTodos: () => void app.alSalirDeTodo(),
    cambiarTema: async (v: Tema) => { guardarTema(v); setTema(v); },
    cambiarTamano: async (v: TamanoDelTexto) => { guardarTamano(v); setTamano(v); },
    cambiarIdioma: (i: Idioma) => app.cambiarIdioma(i),
    cambiarAviso: (_id: string, activo: boolean) => guardarEnLaFicha({ avisos_por_correo: activo }),
    exportar: () => void exportar(t, app),
    borrarCuenta: (codigo?: string) => void borrarCuenta(codigo),
  };

  /* La zona peligrosa del molde no avisa cuando se abre, y quien no tiene
     autenticador necesita que le llegue un código antes de poder escribirlo:
     se escucha el clic en su botón («Borrar mi cuenta») y se manda el código
     por correo. Va como propuesta al molde (un `onAbrir` en `ZonaPeligrosa`). */
  const alAbrirLaZona = (e: MouseEvent<HTMLDivElement>) => {
    if (autenticador || !correo) return;
    const boton = (e.target as HTMLElement).closest('button');
    if (!boton || boton.textContent?.trim() !== t('settings.data.delete')) return;
    void supabase.auth.signInWithOtp({ email: correo, options: { shouldCreateUser: false } })
      .then(({ error }) => app.alAvisar(t(error ? 'mi.ajustes.error' : 'mi.ajustes.borrar.codigoEnviado'), error ? 'danger' : 'success'));
  };

  return (
    <div onClickCapture={alAbrirLaZona}>
      <Ajustes
        t={t}
        appNombre={design.app.nombre}
        ctx={ctx}
        config={config}
        valores={valores}
        acciones={acciones}
        seccion={seccion}
        onSeccion={onSeccion}
        /* Dentro del shell, el relleno lo pone el shell (como en la app de muestra del molde). */
        style={{ padding: 0 }}
      />
    </div>
  );
}

/** Exportar mis datos: lo que la API sabe de la persona, en un archivo, en el momento. */
async function exportar(t: T, app: AccionesDeLaApp): Promise<void> {
  try {
    const [yo, talleres] = await Promise.all([api<unknown>('yo'), api<{ mios: unknown[] }>('talleres')]);
    const contenido = JSON.stringify({ exportado: new Date().toISOString(), yo, inscripciones: talleres.mios }, null, 2);
    descargar(`${t('mi.ajustes.exportar.archivo')}.json`, contenido, 'application/json;charset=utf-8');
  } catch {
    app.alAvisar(t('mi.ajustes.error'), 'danger');
  }
}

/* ── «Perfil del taller»: la sección propia de Mi espacio ────────────────── */

/** Una fila con su campo y «GUARDAR», como las del molde (que no exporta la suya). */
function FilaDeTexto({ t, nombre, explicacion, valor, error, accion, inputMode, maxLength, autoComplete }: {
  t: T; nombre: string; explicacion?: string; valor: string; error?: string | null;
  accion: (v: string) => Promise<unknown>; inputMode?: 'numeric'; maxLength?: number; autoComplete?: string;
}) {
  const [texto, setTexto] = useState(valor);
  useEffect(() => setTexto(valor), [valor]);
  const [guardadoEn, guardar] = useGuardar(accion);
  const [ocupado, setOcupado] = useState(false);
  const cambio = texto.trim() !== valor.trim();
  return (
    <FilaAjuste nombre={nombre} explicacion={explicacion} guardadoEn={guardadoEn} textoGuardado={t('settings.saved')}>
      <form
        style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}
        onSubmit={async (e) => { e.preventDefault(); setOcupado(true); try { await guardar(texto.trim()); } catch { /* Lo avisa la acción. */ } finally { setOcupado(false); } }}
      >
        <Campo aria-label={nombre} value={texto} onChange={(e) => setTexto(e.target.value)} error={error ?? undefined}
          inputMode={inputMode} maxLength={maxLength} autoComplete={autoComplete} style={{ flex: '1 1 14rem', minWidth: 0, maxWidth: '20rem' }} />
        <Boton type="submit" tamano="chico" disabled={!cambio} cargando={ocupado}>{t('settings.save')}</Boton>
      </form>
    </FilaAjuste>
  );
}

/** Una fila con una lista que guarda sola al elegir. */
function FilaDeLista({ t, nombre, explicacion, valor, opciones, accion }: {
  t: T; nombre: string; explicacion?: string; valor: string; opciones: Array<{ value: string; label: string }>;
  accion: (v: string) => Promise<unknown>;
}) {
  const [actual, setActual] = useState(valor);
  useEffect(() => setActual(valor), [valor]);
  const [guardadoEn, guardar] = useGuardar(accion);
  return (
    <FilaAjuste nombre={nombre} explicacion={explicacion} guardadoEn={guardadoEn} textoGuardado={t('settings.saved')}>
      <Selector
        label={nombre} value={actual} options={opciones} buscable={opciones.length > 12}
        onChange={(v) => { setActual(v); guardar(v).catch(() => setActual(valor)); }}
        containerStyle={{ minWidth: '14rem', maxWidth: '20rem' }}
      />
    </FilaAjuste>
  );
}

export function PanelDelTaller({ t, valores }: PropsDePanel) {
  const { t: ti } = useTranslation();
  const { yo, app } = valores.taller as { yo: Yo; app: AccionesDeLaApp };
  const p = yo.persona;
  const idioma = t.idioma as Idioma;
  const paises = useMemo(() => paisesParaElegir(idioma), [idioma]);
  const [errores, setErrores] = useState<Partial<Record<CampoDelPerfil, string>>>({});
  const [whatsapp, setWhatsapp] = useState(p?.whatsapp ?? '');
  useEffect(() => setWhatsapp(p?.whatsapp ?? ''), [p?.whatsapp]);

  const entrada = (cambio: Partial<PerfilEntrada>): PerfilEntrada => ({
    nombre: p?.nombre ?? '', apellido: p?.apellido ?? '', whatsapp: p?.whatsapp ?? '', pais: p?.pais ?? '',
    ciudad: p?.ciudad ?? '', anio_nacimiento: p?.anio_nacimiento ? String(p.anio_nacimiento) : '', nivel_educativo: p?.nivel_educativo ?? '',
    ...cambio,
  });

  /** Valida con `core` (`validarPerfil`) y guarda solo ese campo. */
  const guardarCampo = (campo: CampoDelPerfil) => async (valor: string) => {
    const datos = entrada({ [campo]: valor });
    const encontrados = validarPerfil(datos);
    setErrores((e) => ({ ...e, [campo]: encontrados[campo] }));
    if (encontrados[campo]) throw new Error('no válido');
    const todo = perfilParaEnviar(datos) as Record<string, unknown>;
    try {
      await api('yo', { metodo: 'POST', cuerpo: { [campo]: todo[campo] } });
      await app.recargar();
    } catch (e) {
      app.alAvisar(t('mi.ajustes.error'), 'danger');
      throw e;
    }
  };
  const error = (campo: CampoDelPerfil) => (errores[campo] ? ti(errores[campo]!) : null);
  const anio = p?.anio_nacimiento ?? null;
  const edad = edadDesdeAnio(anio);
  const [guardadoWa, guardarWa] = useGuardar(guardarCampo('whatsapp'));

  return (
    <>
      <CabeceraSeccion titulo={t('mi.ajustes.taller')} hint={t('mi.ajustes.taller.hint')} />
      <Bloque>
        <FilaDeTexto t={t} nombre={t('mi.campos.apellido.nombre')} explicacion={t('mi.campos.apellido.d')} valor={p?.apellido ?? ''}
          error={error('apellido')} accion={guardarCampo('apellido')} autoComplete="family-name" />
        <FilaAjuste nombre={t('mi.campos.whatsapp.nombre')} explicacion={t('mi.campos.whatsapp.d')} guardadoEn={guardadoWa} textoGuardado={t('settings.saved')}>
          <form
            style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}
            onSubmit={(e) => { e.preventDefault(); guardarWa(whatsapp).catch(() => {}); }}
          >
            <div style={{ flex: '1 1 16rem', minWidth: 0, maxWidth: '22rem' }}>
              <CampoWhatsApp id="taller-whatsapp" rotulo={t('mi.campos.whatsapp.nombre')} valor={whatsapp} paisSugerido={p?.pais ?? null}
                error={errores.whatsapp} alCambiar={setWhatsapp} sinRotulo />
            </div>
            <Boton type="submit" tamano="chico" disabled={whatsapp.trim() === (p?.whatsapp ?? '').trim()}>{t('settings.save')}</Boton>
          </form>
        </FilaAjuste>
        <FilaDeLista t={t} nombre={t('mi.campos.pais.nombre')} explicacion={t('mi.campos.pais.d')} valor={p?.pais ?? ''}
          opciones={paises.map((x) => ({ value: x.codigo, label: x.nombre }))} accion={guardarCampo('pais')} />
        <FilaDeTexto t={t} nombre={t('mi.campos.ciudad.nombre')} valor={p?.ciudad ?? ''} error={error('ciudad')}
          accion={guardarCampo('ciudad')} maxLength={120} autoComplete="address-level2" />
        <FilaDeTexto t={t} nombre={t('mi.campos.anio.nombre')} explicacion={edad !== null ? t('mi.campos.anio.edad', { edad }) : t('mi.campos.anio.d')}
          valor={anio ? String(anio) : ''} error={error('anio_nacimiento')} accion={guardarCampo('anio_nacimiento')} inputMode="numeric" maxLength={4} autoComplete="bday-year" />
        <FilaDeLista t={t} nombre={t('mi.campos.nivel.nombre')} valor={p?.nivel_educativo ?? ''}
          opciones={NIVELES_EDUCATIVOS.map((n) => ({ value: n, label: ti(`miEspacio.niveles.${n}`) }))} accion={guardarCampo('nivel_educativo')} />
      </Bloque>
      <Bloque antetitulo={t('mi.ajustes.taller.paraQue')} style={{ marginTop: 'var(--space-16)' }}>
        <p style={{ color: 'var(--text-2)', padding: 'var(--space-4) 0', maxWidth: '60ch' }}>{t('mi.ajustes.taller.paraQue.texto')}</p>
        <Enlace href={`${WEB}/privacidad#perfil`}>{t('mi.ajustes.taller.aviso')}</Enlace>
      </Bloque>
    </>
  );
}

