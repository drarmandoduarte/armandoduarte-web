import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabase';
import { api, ErrorDeApi } from '../comun/api';
import { BotonPrincipal, Campo, CampoDeCodigo, Pantalla } from '../comun/Piezas';

/**
 * PANTALLA 3 · el reto — seis dígitos del autenticador, **o** un código de
 * respaldo.
 *
 * ── Por qué el código de respaldo se usa desde acá ──────────────────────
 * Porque acá es donde está la persona que perdió el celular. Es una regla del
 * kit —«el código de respaldo se usa desde la pantalla de entrada»— y es la
 * razón de que `POST /api/respaldo/usar` sea una de las dos rutas con
 * `@SinSegundoPaso`: pedirle `aal2` a alguien para dejarlo llegar a `aal2` es
 * la puerta cerrada por dentro.
 */
export function Reto({ alVerificar }: { alVerificar: () => void }) {
  const { t } = useTranslation();
  const [modo, setModo] = useState<'totp' | 'respaldo'>('totp');
  const [codigo, setCodigo] = useState('');
  const [respaldo, setRespaldo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  async function conAutenticador(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setVerificando(true);
    const factores = await supabase.auth.mfa.listFactors();
    const factor = factores.data?.totp?.[0];
    if (!factor) {
      setVerificando(false);
      return setError(t('comun.errorGenerico'));
    }
    const reto = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (reto.error || !reto.data) {
      setVerificando(false);
      return setError(t('comun.errorGenerico'));
    }
    const { error: fallo } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: reto.data.id,
      code: codigo,
    });
    setVerificando(false);
    if (fallo) return setError(t('reto.codigoInvalido'));
    alVerificar();
  }

  async function conRespaldo(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    setVerificando(true);
    try {
      await api('respaldo/usar', { metodo: 'POST', cuerpo: { codigo: respaldo.trim() } });
      alVerificar();
    } catch (fallo) {
      /* Se muestra NUESTRO texto, nunca el del servidor: ver `comun/api.ts`. */
      setError(
        fallo instanceof ErrorDeApi && fallo.estado === 400
          ? t('reto.respaldoInvalido')
          : t('comun.errorGenerico'),
      );
    } finally {
      setVerificando(false);
    }
  }

  if (modo === 'respaldo') {
    return (
      <Pantalla>
        <h1 className="titulo">{t('reto.respaldoTitulo')}</h1>
        <p className="bajada">{t('reto.respaldoBajada')}</p>
        <form onSubmit={conRespaldo} noValidate>
          <Campo
            id="respaldo"
            rotulo={t('reto.respaldoEtiqueta')}
            error={error}
            value={respaldo}
            onChange={(e) => setRespaldo(e.target.value.toUpperCase())}
            autoComplete="one-time-code"
            autoFocus
          />
          <div className="fila">
            <BotonPrincipal cargando={verificando} textoCargando={t('reto.verificando')}>
              {t('reto.verificar')}
            </BotonPrincipal>
          </div>
        </form>
        <div className="fila fila--suelta">
          <button type="button" className="enlace" onClick={() => { setModo('totp'); setError(null); }}>
            {t('reto.volverAlAutenticador')}
          </button>
        </div>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <h1 className="titulo">{t('reto.titulo')}</h1>
      <p className="bajada">{t('reto.bajada')}</p>
      <form onSubmit={conAutenticador} noValidate>
        <CampoDeCodigo
          id="totp"
          rotulo={t('reto.codigoEtiqueta')}
          valor={codigo}
          alCambiar={setCodigo}
          error={error}
          autoFocus
        />
        <div className="fila">
          <BotonPrincipal cargando={verificando} textoCargando={t('reto.verificando')}>
            {t('reto.verificar')}
          </BotonPrincipal>
        </div>
      </form>
      <div className="fila fila--suelta">
        <button type="button" className="enlace" onClick={() => { setModo('respaldo'); setError(null); }}>
          {t('reto.usarRespaldo')}
        </button>
      </div>
    </Pantalla>
  );
}
