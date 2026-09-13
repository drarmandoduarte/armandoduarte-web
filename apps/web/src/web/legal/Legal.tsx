import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Marco } from '../comun/Marco';
import { Seccion } from '../comun/Seccion';
import type { Pagina } from '../comun/cabeza';

/**
 * El cuerpo que comparten las dos páginas legales: una sola sección, ancho de
 * lectura, el rótulo «Legal», el `<h1>` y la bajada.
 *
 * **Sin `.reveal`**, y es del original: un aviso de privacidad no se presenta,
 * se lee. Un texto legal que aparece con un fundido mientras alguien lo recorre
 * buscando cómo ejercer sus derechos ARCO es una animación puesta donde estorba.
 */
export function Legal({
  pagina,
  titulo,
  lead,
  children,
}: {
  pagina: Extract<Pagina, 'privacidad' | 'terminos'>;
  titulo: string;
  lead: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Marco pagina={pagina} mensaje={t('comun.mensajes.general')}>
      <Seccion clase="legal">
        <span className="eyebrow">{t(`${pagina}.eyebrow`)}</span>
        <h1 className="display-m u-mt-4">{titulo}</h1>
        <p className="lead u-mt-4">{lead}</p>
        {children}
      </Seccion>
    </Marco>
  );
}
