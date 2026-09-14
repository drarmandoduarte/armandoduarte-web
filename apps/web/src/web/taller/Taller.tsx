import { useTranslation } from 'react-i18next';
import { Marco } from '../comun/Marco';
import { Hero } from './Hero';
import { Suena } from './Suena';
import { Porque } from './Porque';
import { Programa } from './Programa';
import { Facilitador } from './Facilitador';
import { Testimonios } from './Testimonios';
import { Inversion } from './Inversion';
import { Preguntas } from './Preguntas';
import { Reservar } from './Reservar';

/**
 * La página del taller.
 *
 * Es, además, **la plantilla de «página de curso»** que la academia va a
 * heredar: hero, hechos, el problema, el porqué, el programa en pasos, quién lo
 * da, testimonios, precio, preguntas y cierre. Por eso la web nace dentro del
 * monorepo y no al costado — la razón está escrita en el README.
 */
export function Taller() {
  const { t } = useTranslation();
  return (
    <Marco pagina="taller" mensaje={t('comun.mensajes.reservar')}>
      <Hero />
      <Suena />
      <Porque />
      <Programa />
      <Facilitador />
      <Testimonios />
      <Inversion />
      <Preguntas />
      <Reservar />
    </Marco>
  );
}
