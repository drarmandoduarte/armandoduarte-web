import { CodigosRespaldo } from '@moldes/ui';
import { archivoDeCodigos } from './nucleo/nombres';
import { MarcoDeAcceso } from './Marco';
import { useT } from './textos';

/**
 * P5 · Códigos de respaldo (`/auth/2fa/respaldo`, inmediatamente después de
 * P4). También es lo que se ve al regenerarlos desde Ajustes → Seguridad.
 *
 * `CodigosRespaldo` del molde: los diez en dos columnas, Descargar · Copiar ·
 * Compartir, y «Listo, los guardé» apagado hasta que se use uno de los tres
 * (regla del kit: son la única forma de entrar si se pierde el teléfono, se
 * muestran una sola vez y no se pueden volver a pedir). El archivo se llama
 * como dice el núcleo (`archivoDeCodigos()`).
 */
export function Respaldo({ codigos, alTerminar }: { codigos: string[]; alTerminar: () => void }) {
  const { t } = useT();
  return (
    <MarcoDeAcceso antetitulo={t('auth.backup.eyebrow')} titulo={t('auth.backup.title')} subtitulo={t('auth.backup.subtitle')}>
      <CodigosRespaldo
        codigos={codigos}
        nombreArchivo={archivoDeCodigos()}
        textos={{
          descargar: t('auth.backup.download'),
          copiar: t('auth.backup.copy'),
          compartir: t('auth.backup.share'),
          listo: t('auth.backup.done'),
        }}
        onListo={alTerminar}
      />
    </MarcoDeAcceso>
  );
}
