import { useState } from 'react';
import { archivoDeCodigos } from '../seguridad-512/nucleo/nombres';
import { BotonDeAcceso, MarcoDeAcceso, useTextos } from './Marco';

/**
 * P5 · Códigos de respaldo (`/auth/2fa/respaldo`, inmediatamente después de
 * P4) — guion v1, §4. También es lo que se ve al regenerarlos desde Ajustes →
 * Seguridad.
 *
 * «Listo, los guardé» está **apagado hasta que se use uno de los tres**
 * (descargar, copiar, compartir). Regla del kit: estos diez son la única forma
 * de entrar si se pierde el teléfono, se muestran una sola vez y no se pueden
 * volver a pedir. Compartir solo aparece si el navegador lo tiene.
 */
export function Respaldo({ codigos, alTerminar }: { codigos: string[]; alTerminar: () => void }) {
  const { ta } = useTextos();
  const [guardados, setGuardados] = useState(false);
  const texto = codigos.join('\n');
  const puedeCompartir = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  function descargar() {
    const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivoDeCodigos();
    enlace.click();
    URL.revokeObjectURL(url);
    setGuardados(true);
  }

  async function copiar() {
    await navigator.clipboard?.writeText(texto);
    setGuardados(true);
  }

  async function compartir() {
    try {
      await navigator.share({ title: archivoDeCodigos(), text: texto });
      setGuardados(true);
    } catch {
      /* Canceló la hoja de compartir: no cuenta como guardado. */
    }
  }

  return (
    <MarcoDeAcceso antetitulo={ta('backup.eyebrow')} titulo={ta('backup.title')} subtitulo={ta('backup.subtitle')}>
      {/* `<ol>`: diez cosas contables, y el lector de pantalla dice «uno de diez». */}
      <ol className="acceso__codigos">
        {codigos.map((c) => <li key={c}>{c}</li>)}
      </ol>
      <div className="acceso__chicos acceso__chicos--izquierda">
        <button type="button" className="acceso__chico" onClick={descargar}>{ta('backup.download')}</button>
        <button type="button" className="acceso__chico" onClick={() => void copiar()}>{ta('backup.copy')}</button>
        {puedeCompartir ? <button type="button" className="acceso__chico" onClick={() => void compartir()}>{ta('backup.share')}</button> : null}
      </div>
      <div className="acceso__acciones">
        <BotonDeAcceso type="button" flecha disabled={!guardados} onClick={alTerminar}>{ta('backup.done')}</BotonDeAcceso>
      </div>
    </MarcoDeAcceso>
  );
}
