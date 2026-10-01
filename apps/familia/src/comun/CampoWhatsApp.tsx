import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  PAIS_DEL_WHATSAPP, armarWhatsapp, ejemploNacional, nacionalMientrasSeEscribe, normalizarParaBuscar,
  paisesParaElegir, partirWhatsapp, prefijoDe, tienePrefijo,
} from '@codice/core';

/**
 * El WhatsApp con prefijo de país y bandera — orden #32.
 *
 * ── Lo premium: que se vea como UN campo ────────────────────────────────
 * Un solo borde, el de los demás campos, partido adentro por una hairline: a
 * la izquierda el país (bandera 20×15 + «+52» + chevron), a la derecha el
 * número nacional. El foco pinta el borde entero en teal, como en cualquier
 * campo (`:focus-within`).
 *
 * ── El selector, y por qué no es un `<select>` ──────────────────────────
 * Un `<select>` nativo no muestra banderas ni busca. Es el patrón de combobox
 * de WAI-ARIA con un buscador adentro: el botón abre la lista, el foco va al
 * buscador, las flechas mueven la opción activa (`aria-activedescendant`),
 * Enter elige, Esc cierra y devuelve el foco al botón; tipear filtra. Sin
 * telón: se cierra al elegir o con un clic afuera.
 *
 * ── Qué decide `core` y qué no ──────────────────────────────────────────
 * Todo lo del número (prefijo, armado, partido, formato, ejemplo, validez) es
 * `@codice/core` (`whatsapp.ts`). Este archivo solo pinta y maneja el foco. El
 * valor que sube es el texto internacional (`+529991234567`); la pantalla lo
 * valida con `core` y el error le llega como clave: acá se escribe con el
 * nombre del país elegido («Ese número no parece de México»).
 *
 * ── El enlace con «País» ────────────────────────────────────────────────
 * `paisSugerido` es el País del formulario: mientras la persona no haya
 * elegido el prefijo a mano, lo sigue. Si lo tocó, se respeta.
 *
 * Banderas: `public/banderas/<iso>.svg`, de flag-icons (MIT, `docs/creditos.md`).
 */
export function CampoWhatsApp({
  id,
  rotulo,
  ayuda,
  valor,
  alCambiar,
  error,
  paisSugerido,
}: {
  id: string;
  rotulo: string;
  ayuda?: string;
  valor: string;
  alCambiar: (valor: string) => void;
  /** Clave de `familia.json` (`miEspacio.errores.whatsapp…`), o nada. */
  error?: string | null;
  /** El País del formulario, si lo hay. */
  paisSugerido?: string | null;
}) {
  const { t, i18n } = useTranslation();
  /* Lo guardado, partido una sola vez al montar: después manda lo que se escribe. */
  const [inicial] = useState(() => partirWhatsapp(valor, paisSugerido ?? PAIS_DEL_WHATSAPP));
  const [pais, setPais] = useState(inicial.pais);
  const [digitos, setDigitos] = useState(inicial.nacional);
  /* Un número ya guardado cuenta como elegido: cambiar País no le cambia el prefijo. */
  const [tocado, setTocado] = useState(inicial.nacional !== '');
  const paisAnterior = useRef(paisSugerido);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [activo, setActivo] = useState(0);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const numero = useRef<HTMLInputElement>(null);
  const buscador = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  const paises = useMemo(
    () => paisesParaElegir(i18n.language || 'es').filter((p) => tienePrefijo(p.codigo)).map((p) => ({ ...p, prefijo: prefijoDe(p.codigo) })),
    [i18n.language],
  );
  const filtrados = useMemo(() => {
    const q = normalizarParaBuscar(busqueda.trim());
    if (!q) return paises;
    const qDigitos = q.replace(/\D/g, '');
    return paises.filter((p) => normalizarParaBuscar(p.nombre).includes(q)
      || p.codigo.toLowerCase() === q
      || (qDigitos !== '' && p.prefijo.replace('+', '').startsWith(qDigitos)));
  }, [busqueda, paises]);
  const nombre = paises.find((p) => p.codigo === pais)?.nombre ?? pais;
  const prefijo = prefijoDe(pais);

  /* El País del formulario manda mientras el prefijo no se haya tocado. Solo
     cuando País *cambia*: al montar, manda lo guardado. */
  useEffect(() => {
    if (paisAnterior.current === paisSugerido) return;
    paisAnterior.current = paisSugerido;
    if (tocado || !paisSugerido || !tienePrefijo(paisSugerido) || paisSugerido === pais) return;
    setPais(paisSugerido);
    alCambiar(armarWhatsapp(paisSugerido, digitos));
  }, [paisSugerido]);

  /* Un clic afuera cierra, sin elegir. */
  useEffect(() => {
    if (!abierto) return;
    const afuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', afuera);
    return () => document.removeEventListener('mousedown', afuera);
  }, [abierto]);

  /* Al abrir, el foco al buscador; la opción activa, siempre a la vista. */
  useEffect(() => {
    if (abierto) buscador.current?.focus();
  }, [abierto]);
  useEffect(() => {
    if (!abierto) return;
    const op = lista.current?.querySelector<HTMLElement>(`[data-indice="${activo}"]`);
    op?.scrollIntoView?.({ block: 'nearest' });
  }, [activo, abierto]);

  function abrir(conTexto = '') {
    setBusqueda(conTexto);
    const i = paises.findIndex((p) => p.codigo === pais);
    setActivo(conTexto ? 0 : Math.max(i, 0));
    setAbierto(true);
  }

  function cerrar(devolverFoco = true) {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  }

  function elegir(codigo: string) {
    setPais(codigo);
    setTocado(true);
    alCambiar(armarWhatsapp(codigo, digitos));
    setAbierto(false);
    numero.current?.focus();
  }

  function alEscribir(texto: string) {
    /* Pegaron el número entero, con su «+»: el país sale del número. */
    if (texto.trim().startsWith('+')) {
      const p = partirWhatsapp(texto, pais);
      setPais(p.pais);
      setTocado(true);
      setDigitos(p.nacional);
      alCambiar(armarWhatsapp(p.pais, p.nacional));
      return;
    }
    const solo = texto.replace(/\D/g, '');
    setDigitos(solo);
    alCambiar(armarWhatsapp(pais, solo));
  }

  function teclaEnBoton(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      abrir();
    } else if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
      /* Tipear sobre el botón abre la lista ya buscando. */
      e.preventDefault();
      abrir(e.key);
    }
  }

  function teclaEnBuscador(e: KeyboardEvent<HTMLInputElement>) {
    const ultimo = filtrados.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((a) => Math.min(a + 1, ultimo)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setActivo(0); }
    else if (e.key === 'End') { e.preventDefault(); setActivo(Math.max(ultimo, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filtrados[activo]) elegir(filtrados[activo].codigo); }
    else if (e.key === 'Escape') { e.preventDefault(); cerrar(); }
    else if (e.key === 'Tab') cerrar(false);
  }

  const idLista = `${id}-paises`;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const opcionActiva = filtrados[activo] ? `${id}-op-${filtrados[activo].codigo}` : undefined;

  return (
    <div className="campo whatsapp" ref={caja}>
      <label className="campo__rotulo" htmlFor={id}>{rotulo}</label>
      <div className={`whatsapp__caja${error ? ' whatsapp__caja--error' : ''}`} data-whatsapp>
        <button
          ref={boton}
          type="button"
          className="whatsapp__pais"
          id={`${id}-pais`}
          aria-haspopup="listbox"
          aria-expanded={abierto}
          aria-controls={abierto ? idLista : undefined}
          aria-label={t('miEspacio.whatsappCampo.paisElegido', { pais: nombre, prefijo })}
          onClick={() => (abierto ? cerrar() : abrir())}
          onKeyDown={teclaEnBoton}
        >
          <img src={`/banderas/${pais.toLowerCase()}.svg`} width={20} height={15} alt="" className="whatsapp__bandera" />
          <span className="whatsapp__prefijo">{prefijo}</span>
          <ChevronDown size={14} strokeWidth={1.5} aria-hidden className="whatsapp__chevron" />
        </button>
        <input
          ref={numero}
          id={id}
          className="whatsapp__numero"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={ejemploNacional(pais)}
          value={nacionalMientrasSeEscribe(digitos, pais)}
          onChange={(e) => alEscribir(e.target.value)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        />
      </div>

      {abierto ? (
        <div className="whatsapp__lista">
          <input
            ref={buscador}
            className="whatsapp__buscar"
            type="text"
            autoComplete="off"
            enterKeyHint="search"
            role="combobox"
            aria-label={t('miEspacio.whatsappCampo.buscar')}
            placeholder={t('miEspacio.whatsappCampo.buscar')}
            aria-expanded="true"
            aria-controls={idLista}
            aria-autocomplete="list"
            aria-activedescendant={opcionActiva}
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setActivo(0); }}
            onKeyDown={teclaEnBuscador}
          />
          <ul ref={lista} id={idLista} role="listbox" aria-label={t('miEspacio.whatsappCampo.lista')} className="whatsapp__opciones">
            {filtrados.length === 0 ? (
              <li className="whatsapp__vacio" role="presentation">{t('miEspacio.whatsappCampo.sinResultados')}</li>
            ) : filtrados.map((p, i) => (
              <li
                key={p.codigo}
                id={`${id}-op-${p.codigo}`}
                role="option"
                aria-selected={p.codigo === pais}
                data-indice={i}
                className={`whatsapp__opcion${i === activo ? ' whatsapp__opcion--activa' : ''}`}
                onMouseEnter={() => setActivo(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(p.codigo)}
              >
                <img src={`/banderas/${p.codigo.toLowerCase()}.svg`} width={20} height={15} alt="" loading="lazy" className="whatsapp__bandera" />
                <span className="whatsapp__nombre">{p.nombre}</span>
                <span className="whatsapp__prefijo-op">{p.prefijo}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ayuda ? <span className="campo__ayuda" id={idAyuda}>{ayuda}</span> : null}
      {error ? <span className="error" id={idError} role="alert">{t(error, { pais: nombre })}</span> : null}
    </div>
  );
}
