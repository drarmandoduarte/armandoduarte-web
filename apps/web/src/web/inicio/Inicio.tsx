import { useTranslation } from 'react-i18next';
import { Marco } from '../comun/Marco';
import { Hero } from './Hero';
import { Ahora } from './Ahora';
import { Quien } from './Quien';
import { Hago } from './Hago';
import { Taller } from './Taller';
import { Libros } from './Libros';
import { Programa } from './Programa';
import { Contacto } from './Contacto';

/**
 * La portada. El orden de las secciones es el ritmo de fondos: crema, teal,
 * crema, cálido, teal, blanco, cálido, tinta. Dos oscuras seguidas no existen.
 */
export function Inicio() {
  const { t } = useTranslation();
  return (
    <Marco pagina="inicio" mensaje={t('comun.mensajes.general')}>
      <Hero />
      <Ahora />
      <Quien />
      <Hago />
      <Taller />
      <Libros />
      <Programa />
      <Contacto />
    </Marco>
  );
}
