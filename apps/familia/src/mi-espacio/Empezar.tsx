import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { empezarParaEnviar, paisesParaElegir, validarEmpezar, type CampoDeEmpezar, type EmpezarEntrada } from '@codice/core';
import { api, type Yo } from '../comun/api';
import { BotonPrincipal, Campo, Pantalla, Selector, Titulo } from '../comun/Piezas';
import { WEB } from '../rutas';

/**
 * `/empezar` — la primera entrada completa los datos (orden #29, C).
 *
 * Quién llega acá lo decide `rutaQueCorresponde()` con `necesitaEmpezar()` de
 * `core`: a quien le falta nombre, apellido o WhatsApp, antes que a cualquier
 * otra ruta. Esta pantalla solo pide, valida con `core` y guarda.
 *
 * Sin barra lateral, como `/entrar`: el panel cálido con la firma a la
 * izquierda y el formulario a la derecha (`Pantalla conArmando`). Todavía no
 * es «adentro»: es la puerta, un paso más.
 *
 * Pide lo mínimo (C.3): los tres obligatorios, país (México por defecto) y
 * ciudad opcional. Año de nacimiento y nivel educativo quedan en Mis datos.
 * Al guardar, `recargar()` vuelve a preguntar `/api/yo`; con los tres datos,
 * `rutaQueCorresponde()` ya no manda acá y sigue al destino guardado (el
 * `?ir=`) o a Inicio. Esta pantalla no navega: lo hace la regla.
 */
export function Empezar({ yo, recargar }: { yo: Yo; recargar: () => Promise<void> }) {
  const { t, i18n } = useTranslation();
  const p = yo.persona;
  const [datos, setDatos] = useState<EmpezarEntrada>(() => ({
    nombre: p?.nombre ?? '',
    apellido: p?.apellido ?? '',
    whatsapp: p?.whatsapp ?? '',
    pais: p?.pais ?? 'MX',
    ciudad: p?.ciudad ?? '',
  }));
  const [errores, setErrores] = useState<Partial<Record<CampoDeEmpezar, string>>>({});
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'error'>('quieto');
  const paises = useMemo(() => paisesParaElegir(i18n.language || 'es'), [i18n.language]);

  const cambiar = (campo: CampoDeEmpezar) => (e: { target: { value: string } }) => {
    setDatos((d) => ({ ...d, [campo]: e.target.value }));
    setEstado('quieto');
  };
  const error = (campo: CampoDeEmpezar) => (errores[campo] ? t(errores[campo]!) : null);

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    const encontrados = validarEmpezar(datos);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEstado('guardando');
    try {
      await api('yo', { metodo: 'POST', cuerpo: empezarParaEnviar(datos) });
      await recargar();
    } catch {
      setEstado('error');
    }
  }

  return (
    <Pantalla conArmando>
      <Titulo texto={t('empezar.titulo')} />
      <p className="bajada">{t('empezar.bajada')}</p>
      <form className="seccion" onSubmit={guardar} noValidate>
        <Campo id="empezar-nombre" rotulo={t('miEspacio.nombre')} value={datos.nombre} autoComplete="given-name"
          required error={error('nombre')} onChange={cambiar('nombre')} />
        <Campo id="empezar-apellido" rotulo={t('miEspacio.apellido')} value={datos.apellido} autoComplete="family-name"
          required error={error('apellido')} onChange={cambiar('apellido')} />
        <Campo id="empezar-whatsapp" rotulo={t('miEspacio.whatsapp')} ayuda={t('miEspacio.whatsappAyuda')}
          value={datos.whatsapp} type="tel" inputMode="tel" autoComplete="tel" required
          error={error('whatsapp')} onChange={cambiar('whatsapp')} />
        <Selector id="empezar-pais" rotulo={t('miEspacio.pais')} value={datos.pais} autoComplete="country"
          error={error('pais')} onChange={cambiar('pais')}
          opciones={paises.map((x) => ({ valor: x.codigo, texto: x.nombre }))} />
        <Campo id="empezar-ciudad" rotulo={t('empezar.ciudadOpcional')} value={datos.ciudad} autoComplete="address-level2"
          maxLength={120} error={error('ciudad')} onChange={cambiar('ciudad')} />
        <p className="nota nota--para-que">
          <a className="enlace" href={`${WEB}/privacidad#perfil`}>{t('empezar.paraQue')}</a>
        </p>
        <div className="fila">
          <BotonPrincipal cargando={estado === 'guardando'} textoCargando={t('empezar.guardando')}>
            {t('empezar.guardar')}
          </BotonPrincipal>
        </div>
        {estado === 'error' ? <p className="error" role="alert">{t('empezar.error')}</p> : null}
      </form>
    </Pantalla>
  );
}
