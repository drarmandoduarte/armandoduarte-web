import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BotonPrincipal, Pantalla } from '../comun/Piezas';
import { archivoDeCodigos } from '../seguridad-512/nucleo/nombres';

/**
 * PANTALLA 4 · los diez códigos de respaldo.
 *
 * ── Guardarlos es OBLIGATORIO para seguir ───────────────────────────────
 * Regla del kit, de las que ninguna app cambia: el botón de continuar está
 * apagado hasta que la persona **descargó, copió o compartió**. No es
 * paternalismo: estos diez códigos son la única forma de entrar si se pierde el
 * celular, se muestran **una sola vez** y no se pueden volver a pedir. Un
 * «continuar» disponible desde el principio es un «continuar» que se toca sin
 * leer, y el costo se paga meses después, con la persona afuera de su cuenta.
 *
 * Tres botones y no uno porque los tres casos existen: en una computadora se
 * descarga, en un gestor de contraseñas se copia, y en un celular se comparte
 * —`navigator.share`, que abre la hoja del sistema—. El de compartir solo
 * aparece si el navegador lo tiene.
 *
 * El nombre del archivo sale de `nucleo/nombres.ts`, que lo arma con el nombre
 * de la app: `armando-duarte-codigos-respaldo.txt`.
 */
export function CodigosDeRespaldo({
  codigos,
  alTerminar,
}: {
  codigos: string[];
  alTerminar: () => void;
}) {
  const { t } = useTranslation();
  const [guardados, setGuardados] = useState<'descargados' | 'copiados' | 'compartidos' | null>(null);

  const texto = codigos.join('\n');
  const puedeCompartir = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  function descargar() {
    const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain' }));
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = archivoDeCodigos();
    enlace.click();
    URL.revokeObjectURL(url);
    setGuardados('descargados');
  }

  async function copiar() {
    await navigator.clipboard?.writeText(texto);
    setGuardados('copiados');
  }

  async function compartir() {
    try {
      await navigator.share({ title: archivoDeCodigos(), text: texto });
      setGuardados('compartidos');
    } catch {
      /* La persona canceló la hoja de compartir. No es un error y no se
         cuenta como guardado: el botón sigue apagado, que es lo correcto. */
    }
  }

  return (
    <Pantalla ancha arriba>
      <h1 className="titulo">{t('respaldo.titulo')}</h1>
      <p className="bajada">{t('respaldo.bajada')}</p>

      {/* `<ol>` y no un `<div>`: son diez cosas contables y en orden, y así un
          lector de pantalla dice «uno de diez» en vez de leer una pared. */}
      <ol className="codigos">
        {codigos.map((codigo) => <li key={codigo}>{codigo}</li>)}
      </ol>

      <div className="fila">
        <button type="button" className="btn btn--ancho" onClick={descargar}>
          {guardados === 'descargados' ? t('respaldo.descargados') : t('respaldo.descargar')}
        </button>
        <button type="button" className="btn btn--ancho" onClick={copiar}>
          {guardados === 'copiados' ? t('respaldo.copiados') : t('respaldo.copiar')}
        </button>
        {puedeCompartir ? (
          <button type="button" className="btn btn--ancho" onClick={compartir}>
            {guardados === 'compartidos' ? t('respaldo.compartidos') : t('respaldo.compartir')}
          </button>
        ) : null}
      </div>

      <div className="seccion">
        {guardados ? null : <p className="nota">{t('respaldo.obligatorio')}</p>}
        <div className="fila">
          <BotonPrincipal type="button" onClick={alTerminar} disabled={!guardados}>
            {t('respaldo.listo')}
          </BotonPrincipal>
        </div>
      </div>
    </Pantalla>
  );
}
