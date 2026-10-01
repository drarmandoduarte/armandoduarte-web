import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '../i18n/recursos';
import {
  NIVELES_EDUCATIVOS, PAISES_ISO, PAISES_LATAM, anioMaximo, edadDesdeAnio, paisesParaElegir, perfilIncompleto,
  perfilParaEnviar, validarPerfil,
} from './perfil';

const vacio = { nombre: '', apellido: '', whatsapp: '', pais: '', ciudad: '', anio_nacimiento: '', nivel_educativo: '' };
const HOY = new Date('2026-10-01T12:00:00Z');

describe('los países', () => {
  it('EL PISO: 249 códigos ISO, sin repetir; 33 de LATAM, todos dentro de la lista', () => {
    expect(PAISES_ISO).toHaveLength(249);
    expect(new Set(PAISES_ISO).size).toBe(249);
    expect(PAISES_LATAM).toHaveLength(33);
    expect(PAISES_LATAM.every((c) => PAISES_ISO.includes(c))).toBe(true);
  });

  it('México primero, después los 32 de LATAM, después el resto; con nombre en español, inglés y portugués', () => {
    for (const idioma of ['es', 'en', 'pt']) {
      const lista = paisesParaElegir(idioma);
      expect(lista).toHaveLength(249);
      expect(lista[0].codigo).toBe('MX');
      expect(new Set(lista.slice(0, 33).map((p) => p.codigo))).toEqual(new Set(PAISES_LATAM));
    }
    expect(paisesParaElegir('es')[0].nombre).toBe('México');
    expect(paisesParaElegir('en').find((p) => p.codigo === 'BR')?.nombre).toBe('Brazil');
    expect(paisesParaElegir('es').find((p) => p.codigo === 'ES')?.nombre).toBe('España');
  });
});

describe('el perfil', () => {
  it('todo vacío no es error: nada es obligatorio', () => {
    expect(validarPerfil(vacio, HOY)).toEqual({});
  });

  it('el año: cuatro cifras, de 1920 a hace 14 años', () => {
    expect(anioMaximo(HOY)).toBe(2012);
    expect(validarPerfil({ ...vacio, anio_nacimiento: '2012' }, HOY)).toEqual({});
    for (const malo of ['1919', '2013', '84', 'mil']) {
      expect(validarPerfil({ ...vacio, anio_nacimiento: malo }, HOY), malo).toEqual({ anio_nacimiento: 'miEspacio.perfil.errores.anio' });
    }
  });

  it('país ISO-2 y nivel de la lista', () => {
    expect(validarPerfil({ ...vacio, pais: 'XX', nivel_educativo: 'doctorado' }, HOY)).toEqual({
      pais: 'miEspacio.perfil.errores.pais', nivel_educativo: 'miEspacio.perfil.errores.nivel',
    });
  });

  it('las claves de error tienen texto en familia.json', () => {
    const f = RECURSOS_I18N.es.familia as unknown as { miEspacio: { perfil: { errores: Record<string, string> } } };
    for (const k of ['pais', 'anio', 'nivel']) expect(f.miEspacio.perfil.errores[k], k).toBeTruthy();
  });

  it('lo que viaja: vacío como null (así se borra), el año como número', () => {
    expect(perfilParaEnviar({ ...vacio, ciudad: ' Mérida ', anio_nacimiento: '1984', pais: 'MX' })).toEqual({
      nombre: null, apellido: null, whatsapp: null, pais: 'MX', ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: null,
    });
  });

  it('la edad se calcula y no se guarda', () => {
    expect(edadDesdeAnio(1984, HOY)).toBe(42);
    expect(edadDesdeAnio(null, HOY)).toBeNull();
  });

  it('incompleto si falta cualquiera de los cuatro', () => {
    const completo = { pais: 'MX', ciudad: 'Mérida', anio_nacimiento: 1984, nivel_educativo: 'posgrado' };
    expect(perfilIncompleto(completo)).toBe(false);
    for (const k of Object.keys(completo)) expect(perfilIncompleto({ ...completo, [k]: null }), k).toBe(true);
  });

  it('los niveles son los del `check` de la migración 011, en el mismo orden', () => {
    const sql = readFileSync(join(import.meta.dirname, '..', '..', '..', 'db', 'migrations', '011_el_perfil.sql'), 'utf8');
    const lista = sql.match(/nivel_educativo in \(([^)]+)\)/)?.[1].match(/'([a-z_]+)'/g)?.map((x) => x.slice(1, -1));
    expect(lista, 'no encontré el check en la 011').toBeDefined();
    expect(lista).toEqual([...NIVELES_EDUCATIVOS]);
  });
});
