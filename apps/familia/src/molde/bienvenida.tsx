import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bienvenida, type PasoDeBienvenida } from '@moldes/bienvenida';
import { Boton, Campo, Selector } from '@moldes/ui';
import type { Idioma, T } from '@moldes/idiomas';
import {
  empezarParaEnviar, paisesParaElegir, pasosDeBienvenida, validarEmpezar, type CampoDeEmpezar, type EmpezarEntrada,
} from '@codice/core';
import { api, type Yo } from '../comun/api';
import { CampoWhatsApp } from '../comun/CampoWhatsApp';

/**
 * La primera entrada: `<Bienvenida>` del molde (orden #37, PR 3 · §9), que
 * reemplaza a `/empezar` de la #29. Los pasos los decide `core`
 * (`pasosDeBienvenida`):
 *
 *   1. **Tus datos** — nombre, apellido y WhatsApp (el campo de la #32).
 *      Obligatorio: sin ellos no hay a quién avisarle de su lugar.
 *   2. **País y ciudad** — se puede saltar; la ciudad es opcional.
 *   3. Solo el equipo sin autenticador: **Activa tu autenticador** (P4 del
 *      kit). En los hechos no aparece: el núcleo le pide P4 al equipo antes
 *      que cualquier pantalla.
 *
 * Cada paso guarda lo suyo (`POST /api/yo`) al tocar «Siguiente»; si falla, la
 * persona se queda en el paso con lo que escribió y el error lo dice. Recién al
 * terminar se vuelve a preguntar quién es: si se recargara después del primer
 * paso, la ficha ya tendría los datos y la Bienvenida se cerraría a la mitad.
 */
export function PaginaDeBienvenida({ t, yo, autenticadorActivo, alActivar, alTerminar }: {
  t: T;
  yo: Yo;
  autenticadorActivo: boolean;
  alActivar: () => void;
  alTerminar: () => Promise<void>;
}) {
  const { t: ti } = useTranslation();
  const p = yo.persona;
  const idioma = t.idioma as Idioma;
  const paises = useMemo(() => paisesParaElegir(idioma), [idioma]);
  const [datos, setDatos] = useState<EmpezarEntrada>(() => ({
    nombre: p?.nombre ?? '', apellido: p?.apellido ?? '', whatsapp: p?.whatsapp ?? '', pais: p?.pais ?? 'MX', ciudad: p?.ciudad ?? '',
  }));
  const [errores, setErrores] = useState<Partial<Record<CampoDeEmpezar, string>>>({});
  const [fallo, setFallo] = useState(false);
  const cambiar = (campo: CampoDeEmpezar) => (valor: string) => { setDatos((d) => ({ ...d, [campo]: valor })); setFallo(false); };
  const error = (campo: CampoDeEmpezar) => (errores[campo] ? ti(errores[campo]!) : undefined);

  /** Valida los campos de este paso con `core`; si algo falta, no avanza. Si guardar falla, tampoco. */
  const guardar = (campos: CampoDeEmpezar[]) => async () => {
    const encontrados = validarEmpezar(datos);
    const delPaso = Object.fromEntries(campos.filter((c) => encontrados[c]).map((c) => [c, encontrados[c]]));
    setErrores(delPaso);
    if (Object.keys(delPaso).length > 0) throw new Error('faltan datos');
    const todo = empezarParaEnviar(datos);
    const cuerpo = Object.fromEntries(campos.filter((c) => c in todo).map((c) => [c, todo[c]]));
    try {
      await api('yo', { metodo: 'POST', cuerpo });
    } catch (e) {
      setFallo(true);
      throw e;
    }
  };

  const aviso = fallo ? <p role="alert" style={{ color: 'var(--danger-text)', fontSize: 'var(--text-md)' }}>{t('mi.bienvenida.error')}</p> : null;

  const PASOS: Record<string, PasoDeBienvenida> = {
    datos: {
      id: 'datos',
      titulo: t('mi.bienvenida.datos.titulo'),
      bajada: t('mi.bienvenida.datos.bajada'),
      obligatoria: true,
      alSeguir: guardar(['nombre', 'apellido', 'whatsapp']),
      contenido: (
        <>
          <Campo etiqueta={t('mi.campos.nombre.nombre')} value={datos.nombre} autoComplete="given-name" required
            error={error('nombre')} onChange={(e) => cambiar('nombre')(e.target.value)} />
          <Campo etiqueta={t('mi.campos.apellido.nombre')} value={datos.apellido} autoComplete="family-name" required
            error={error('apellido')} onChange={(e) => cambiar('apellido')(e.target.value)} />
          <CampoWhatsApp id="bienvenida-whatsapp" rotulo={t('mi.campos.whatsapp.nombre')} ayuda={t('mi.campos.whatsapp.d')}
            valor={datos.whatsapp} paisSugerido={datos.pais} error={errores.whatsapp} alCambiar={cambiar('whatsapp')} />
          {aviso}
        </>
      ),
    },
    lugar: {
      id: 'lugar',
      titulo: t('mi.bienvenida.lugar.titulo'),
      bajada: t('mi.bienvenida.lugar.bajada'),
      alSeguir: guardar(['pais', 'ciudad']),
      contenido: (
        <>
          <Selector label={t('mi.campos.pais.nombre')} value={datos.pais} buscable error={error('pais')}
            options={paises.map((x) => ({ value: x.codigo, label: x.nombre }))} onChange={cambiar('pais')} />
          <Campo etiqueta={t('mi.campos.ciudad.opcional')} value={datos.ciudad} autoComplete="address-level2" maxLength={120}
            error={error('ciudad')} onChange={(e) => cambiar('ciudad')(e.target.value)} />
          {aviso}
        </>
      ),
    },
    autenticador: {
      id: 'autenticador',
      titulo: t('mi.bienvenida.autenticador.titulo'),
      bajada: t('mi.bienvenida.autenticador.bajada'),
      obligatoria: true,
      listo: autenticadorActivo,
      contenido: autenticadorActivo
        ? <p style={{ color: 'var(--success-text)' }}>{t('mi.bienvenida.autenticador.listo')}</p>
        : <Boton onClick={alActivar} flecha>{t('mi.bienvenida.autenticador.boton')}</Boton>,
    },
  };

  const pasos = pasosDeBienvenida(yo.rol, autenticadorActivo).map((id) => PASOS[id]);
  return <Bienvenida t={t} pasos={pasos} onTerminar={alTerminar} />;
}
