import { useTranslation } from 'react-i18next';
import { Retrato } from '../comun/Retrato';
import { Seccion } from '../comun/Seccion';

/**
 * Sobre el facilitador.
 *
 * ── El `style=` que había acá, y por qué ya no está (orden #03) ───────────
 * Las claves de la ficha —«Familia», «Práctica», «Formación», «Obra»— llevaban
 * el color escrito a mano en línea, crema al 60 %, copiado del sitio estático.
 * La #01 lo portó igual y lo dejó anotado como redundante: la regla
 * `.oscuro .ficha li span:first-child` decía exactamente lo mismo.
 *
 * Dejó de ser redundante el día que la regla cambió. La #03 subió ese 60 % a
 * 70 % —3,77 → 4,52 sobre teal— y **estas cuatro claves no se movieron**, porque
 * un `style=` en línea le gana a cualquier selector. Es el defecto de la copia
 * en su forma más pura: el valor duplicado no hace daño mientras nadie toque el
 * original, y el día que alguien lo toca, la copia se queda con el valor viejo
 * en silencio. Lo cazó el barrido de pares de la #03, no una persona mirando.
 *
 * Así que el atributo se borra y manda la regla, que es la única que queda.
 */
export function Facilitador() {
  const { t } = useTranslation();
  return (
    <Seccion id="facilitador" tono="oscuro" contenedor={false}>
      <div className="container grid-2 centro">
        <figure className="foto foto--libre reveal">
          <Retrato cual="de-pie" alt={t('taller.facilitador.fotoAlt')} tamanos="(max-width:900px) 92vw, 480px" />
        </figure>
        <div>
          <span className="eyebrow reveal">{t('taller.facilitador.eyebrow')}</span>
          <h2 className="display-m u-mt-4 reveal" data-d="1">
            {t('taller.facilitador.titulo1')}<br /><span className="suave">{t('taller.facilitador.titulo2')}</span>
          </h2>
          <ul className="ficha reveal" data-d="2">
            <li><span>{t('taller.facilitador.familiaClave')}</span><span>{t('taller.facilitador.familiaValor')}</span></li>
            <li><span>{t('taller.facilitador.practicaClave')}</span><span>{t('taller.facilitador.practicaValor')}</span></li>
            <li><span>{t('taller.facilitador.formacionClave')}</span><span>{t('taller.facilitador.formacionValor')}</span></li>
            <li><span>{t('taller.facilitador.obraClave')}</span><span>{t('taller.facilitador.obraValor')}</span></li>
          </ul>
          <blockquote className="cita u-mt-5 reveal" data-d="3">
            {t('taller.facilitador.cita')}<small>{t('taller.facilitador.citaFirma')}</small>
          </blockquote>
        </div>
      </div>
    </Seccion>
  );
}
