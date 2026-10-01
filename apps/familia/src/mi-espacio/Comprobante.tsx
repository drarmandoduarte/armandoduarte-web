import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ACEPTA_COMPROBANTE, declaracionParaEnviar, fechaDeHoyEn, formatearPrecio, validarArchivoDeComprobante,
  validarDeclaracion, type CampoDeDeclaracion, type DeclaracionEntrada,
} from '@codice/core';
import { api, ErrorDeApi } from '../comun/api';
import { Campo } from '../comun/Piezas';
import { subirComprobante } from './subir-comprobante';

/** Los datos de cobro vigentes, como los devuelve `GET /api/talleres` (004). */
export interface Cobro {
  banco: string;
  titular: string;
  clabe: string;
  concepto_sugerido: string | null;
}

/**
 * «Ya transferí, subo mi comprobante» — el paso, en el mismo lugar (orden #27 C.1).
 *
 * El archivo se valida **antes** de subir (tipo y tamaño, `@codice/core`) y el
 * error se dice en español al lado del campo. Después: subir directo a Storage
 * con la sesión (`subir-comprobante.ts`) y, solo si subió, declarar con la API.
 * Si la subida falla, la API no se llama.
 *
 * Abajo, de vuelta, los datos de cobro vigentes con la referencia: para que la
 * persona compare con lo que transfirió antes de mandar.
 */
export function PasoDeComprobante({
  inscripcionId,
  referencia,
  precioMonto,
  moneda,
  zona,
  cobro,
  naranja,
  alTerminar,
  alCancelar,
}: {
  inscripcionId: string;
  referencia: string;
  precioMonto: number | string | null;
  moneda: string | null;
  zona: string | null;
  cobro: Cobro | null;
  /** D26: lleva el naranja solo si es la acción principal de la pantalla. */
  naranja: boolean;
  alTerminar: () => void;
  alCancelar: () => void;
}) {
  const { t } = useTranslation();
  const hoy = fechaDeHoyEn(zona);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorDeArchivo, setErrorDeArchivo] = useState<string | null>(null);
  const [datos, setDatos] = useState<DeclaracionEntrada>(() => ({
    fecha_transferencia: hoy,
    monto: precioMonto === null || precioMonto === undefined ? '' : String(Number(precioMonto)),
    banco: '',
    ultimos4_o_folio: '',
  }));
  const [errores, setErrores] = useState<Partial<Record<CampoDeDeclaracion, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function elegir(evento: React.ChangeEvent<HTMLInputElement>) {
    const elegido = evento.target.files?.[0] ?? null;
    setArchivo(elegido);
    setErrorDeArchivo(validarArchivoDeComprobante(elegido));
  }

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    const malArchivo = validarArchivoDeComprobante(archivo);
    const malDatos = validarDeclaracion(datos, hoy);
    setErrorDeArchivo(malArchivo);
    setErrores(malDatos);
    if (malArchivo || Object.keys(malDatos).length > 0 || !archivo) return;

    setError(null);
    setEnviando(true);
    let ruta: string;
    try {
      ruta = await subirComprobante(inscripcionId, archivo);
    } catch {
      setError(t('miEspacio.comprobante.errores.subida'));
      setEnviando(false);
      return;
    }
    try {
      await api('pagos/declarar', { metodo: 'POST', cuerpo: declaracionParaEnviar(datos, inscripcionId, ruta, moneda) });
      alTerminar();
    } catch (fallo) {
      const codigo = fallo instanceof ErrorDeApi ? fallo.codigoDelServidor : undefined;
      if (codigo === 'NO_ESPERA_COMPROBANTE') {
        setError(t('miEspacio.comprobante.errores.yaDeclarado'));
      } else {
        setError(t('miEspacio.comprobante.errores.declarar'));
      }
    } finally {
      setEnviando(false);
    }
  }

  const campo = (id: CampoDeDeclaracion, rotulo: string, props: React.InputHTMLAttributes<HTMLInputElement> & { ayuda?: string } = {}) => (
    <Campo
      id={`comprobante-${id}`}
      rotulo={rotulo}
      value={datos[id]}
      error={errores[id] ? t(errores[id]!) : null}
      onChange={(e) => setDatos((d) => ({ ...d, [id]: e.target.value }))}
      {...props}
    />
  );

  return (
    <form className="paso" onSubmit={enviar} noValidate aria-label={t('miEspacio.comprobante.titulo')}>
      <Campo
        id="comprobante-archivo"
        rotulo={t('miEspacio.comprobante.archivo')}
        ayuda={t('miEspacio.comprobante.archivoAyuda')}
        error={errorDeArchivo ? t(errorDeArchivo) : null}
        type="file"
        accept={ACEPTA_COMPROBANTE}
        onChange={elegir}
        autoFocus
      />
      {campo('fecha_transferencia', t('miEspacio.comprobante.fecha'), { type: 'date', max: hoy })}
      {campo('monto', t('miEspacio.comprobante.monto'), {
        inputMode: 'decimal', ayuda: t('miEspacio.comprobante.montoAyuda', { moneda: moneda ?? 'MXN' }),
      })}
      {campo('banco', t('miEspacio.comprobante.banco'), { autoComplete: 'off', maxLength: 80 })}
      {campo('ultimos4_o_folio', t('miEspacio.comprobante.folio'), { autoComplete: 'off', maxLength: 40 })}

      {cobro ? (
        <div className="cobro">
          <p className="nota">{t('miEspacio.comprobante.comparar')}</p>
          <dl className="cobro__datos">
            <dt>{t('miEspacio.banco')}</dt><dd>{cobro.banco}</dd>
            <dt>{t('miEspacio.titular')}</dt><dd>{cobro.titular}</dd>
            <dt>{t('miEspacio.clabe')}</dt><dd className="cobro__clabe"><span>{cobro.clabe}</span></dd>
            <dt>{t('miEspacio.concepto')}</dt><dd>{referencia}</dd>
            {precioMonto !== null && precioMonto !== undefined ? (
              <><dt>{t('miEspacio.monto')}</dt><dd>{formatearPrecio(Number(precioMonto), moneda)}</dd></>
            ) : null}
          </dl>
        </div>
      ) : null}

      <div className="fila">
        <button type="submit" className={`btn btn--ancho${naranja ? ' btn--naranja' : ''}`} disabled={enviando}>
          {enviando ? t('miEspacio.comprobante.enviando') : t('miEspacio.comprobante.enviar')}
        </button>
        <button type="button" className="enlace" onClick={alCancelar} disabled={enviando}>
          {t('comun.cancelar')}
        </button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : null}
    </form>
  );
}
