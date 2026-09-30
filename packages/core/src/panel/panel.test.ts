import { describe, expect, it } from 'vitest';
import {
  esZonaValida, fechaCorta, fechaLarga, horaCorta, horaDeParedDe, instanteDesdeHoraDePared,
} from './zonas';
import {
  cursoParaGuardar, edicionParaGuardar, formatearPrecio, ocupacion, slugDesdeTitulo,
  validarCurso, validarEdicion, type CursoEntrada, type EdicionEntrada,
} from './cursos';
import { aCsv, coincide, enlaceDeSaludo, nombreDeArchivo, telefonoParaWa } from './listas';
import { accionDeEquipo, esTerritorio } from './equipo';

describe('zonas (D15): la hora de pared y su instante', () => {
  it('8:30 del 5/11/2026 en Mérida son las 14:30 UTC, y de vuelta', () => {
    const instante = instanteDesdeHoraDePared('2026-11-05T08:30', 'America/Merida');
    expect(instante).toBe('2026-11-05T14:30:00.000Z');
    expect(horaDeParedDe(instante!, 'America/Merida')).toBe('2026-11-05T08:30');
  });

  it('respeta el horario de verano de la zona: Madrid en julio es UTC+2 y en diciembre UTC+1', () => {
    expect(instanteDesdeHoraDePared('2026-07-10T10:00', 'Europe/Madrid')).toBe('2026-07-10T08:00:00.000Z');
    expect(instanteDesdeHoraDePared('2026-12-10T10:00', 'Europe/Madrid')).toBe('2026-12-10T09:00:00.000Z');
  });

  it('rechaza lo que no tiene forma, fechas que no existen y zonas que no son IANA', () => {
    expect(instanteDesdeHoraDePared('5/11/2026 8:30', 'America/Merida')).toBeNull();
    expect(instanteDesdeHoraDePared('2026-02-31T10:00', 'America/Merida')).toBeNull();
    expect(instanteDesdeHoraDePared('2026-11-05T08:30', 'GMT-6')).toBeNull();
    expect(esZonaValida('America/Merida')).toBe(true);
    expect(esZonaValida('-06:00')).toBe(false);
    expect(esZonaValida('Marte/Olimpo')).toBe(false);
  });

  it('escribe la fecha en la zona que se pide, no en la del navegador', () => {
    const instante = '2026-11-05T14:30:00.000Z';
    expect(fechaLarga(instante, 'America/Merida')).toBe('jueves, 5 de noviembre de 2026, 8:30');
    expect(horaCorta(instante, 'Europe/Madrid')).toBe('15:30');
    expect(horaCorta('2026-11-05T19:00:00.000Z', 'America/Merida')).toBe('13:00');
    expect(fechaCorta(instante, 'America/Merida')).toMatch(/^5 nov\.? 2026, 8:30$/);
  });
});

describe('cursos', () => {
  const bueno: CursoEntrada = {
    titulo: 'El arte de amar a tu adolescente', bajada: '', descripcion: '',
    modalidad: 'presencial', slug: 'el-arte-de-amar-a-tu-adolescente', estado: 'borrador',
  };

  it('el slug se propone desde el título, sin acentos y con la ñ como n', () => {
    expect(slugDesdeTitulo('El arte de amar a tu adolescente')).toBe('el-arte-de-amar-a-tu-adolescente');
    expect(slugDesdeTitulo('  Niños y Señales: ¿qué hago?  ')).toBe('ninos-y-senales-que-hago');
  });

  it('un curso completo no tiene errores; uno vacío los dice campo por campo', () => {
    expect(validarCurso(bueno)).toEqual({});
    expect(validarCurso({ ...bueno, titulo: '  ', slug: 'Con Mayúscula', modalidad: 'x', estado: 'y' })).toEqual({
      titulo: 'equipo.errores.tituloFalta',
      slug: 'equipo.errores.slugForma',
      modalidad: 'equipo.errores.modalidad',
      estado: 'equipo.errores.estado',
    });
  });

  it('lo opcional vacío se guarda como nulo', () => {
    expect(cursoParaGuardar({ ...bueno, bajada: '  ' }).bajada).toBeNull();
  });
});

describe('ediciones', () => {
  const buena: EdicionEntrada = {
    inicio: '2026-11-05T08:30', fin: '2026-11-05T13:00', zona: 'America/Merida',
    sede: 'Fiesta Inn Mérida', ciudad: 'Mérida', pais: 'MX', cupo: '60', precio: '1170',
    inscripcionesHasta: '2026-11-04T20:00', estado: 'abierta',
  };

  it('una edición completa no tiene errores y se guarda con instantes y la zona', () => {
    expect(validarEdicion(buena)).toEqual({});
    expect(edicionParaGuardar(buena)).toMatchObject({
      inicio: '2026-11-05T14:30:00.000Z', fin: '2026-11-05T19:00:00.000Z', zona: 'America/Merida',
      cupo: 60, precio_monto: 1170, precio_moneda: 'MXN', inscripciones_hasta: '2026-11-05T02:00:00.000Z',
    });
  });

  it('el fin antes del inicio, el cupo en cero, el precio con tres decimales y la zona inventada', () => {
    expect(validarEdicion({ ...buena, fin: '2026-11-05T08:00', cupo: '0', precio: '10.999', zona: 'Merida' })).toEqual({
      zona: 'equipo.errores.zona', cupo: 'equipo.errores.cupo', precio: 'equipo.errores.precio',
    });
    expect(validarEdicion({ ...buena, fin: '2026-11-05T08:00' }).fin).toBe('equipo.errores.finAntes');
    expect(validarEdicion({ ...buena, inscripcionesHasta: '2026-11-06T10:00' }).inscripcionesHasta)
      .toBe('equipo.errores.hastaDespues');
    expect(validarEdicion({ ...buena, inicio: '' }).inicio).toBe('equipo.errores.inicioFalta');
    expect(validarEdicion({ ...buena, pais: 'Mexico' }).pais).toBe('equipo.errores.pais');
  });

  it('cupo y precio vacíos son válidos: sin tope y sin precio', () => {
    expect(validarEdicion({ ...buena, cupo: '', precio: '' })).toEqual({});
    expect(edicionParaGuardar({ ...buena, cupo: '', precio: '' })).toMatchObject({ cupo: null, precio_monto: null, precio_moneda: null });
  });

  it('ocupación y precio para mostrar', () => {
    expect(ocupacion(23, 60)).toBe('23 / 60');
    expect(ocupacion(23, null)).toBe('23');
    expect(ocupacion(null, 60)).toBe('—');
    expect(formatearPrecio(1170, 'MXN')).toBe('$1,170 MXN');
    expect(formatearPrecio(1170.5, 'MXN')).toBe('$1,170.50 MXN');
  });
});

describe('listas: buscar, exportar, WhatsApp', () => {
  it('busca sin acentos y con varias palabras en campos distintos', () => {
    expect(coincide(['Ana', 'López', 'ana@x.com', 'AD-0007'], 'lopez')).toBe(true);
    expect(coincide(['Ana', 'López'], 'ana lopez')).toBe(true);
    expect(coincide(['Ana', 'López', null, 'AD-0007'], 'ad-0007')).toBe(true);
    expect(coincide(['Ana', 'López'], 'pilar')).toBe(false);
    expect(coincide(['Ana'], '   ')).toBe(true);
  });

  it('el CSV lleva BOM, CRLF, comillas cuando hacen falta y desarma las fórmulas', () => {
    const csv = aCsv(['nombre', 'nota'], [['Ana, "la mamá"', '=HYPERLINK("x")'], ['Mérida', null]]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toBe('\uFEFFnombre,nota\r\n"Ana, ""la mamá""","\'=HYPERLINK(""x"")"\r\nMérida,\r\n');
    expect(nombreDeArchivo('inscriptos', new Date('2026-09-30T12:00:00Z'))).toBe('inscriptos-2026-09-30.csv');
  });

  it('el WhatsApp arma enlace solo con un número que sirve', () => {
    expect(telefonoParaWa('+52 999 123 4567')).toBe('529991234567');
    expect(telefonoParaWa('123')).toBeNull();
    expect(enlaceDeSaludo('+52 999 123 4567', 'Hola Ana')).toBe('https://wa.me/529991234567?text=Hola%20Ana');
    expect(enlaceDeSaludo(null, 'Hola')).toBeNull();
  });
});

describe('equipo: qué botón ve cada uno', () => {
  const armando = 'u-armando';
  it('solo el dueño ve «Sumar» y «Quitar»; nunca sobre sí mismo ni sobre otro dueño', () => {
    expect(accionDeEquipo('dueno', armando, { persona_id: 'u-ana', rol: null, activo: null })).toBe('sumar');
    expect(accionDeEquipo('dueno', armando, { persona_id: 'u-gabi', rol: 'equipo', activo: true })).toBe('quitar');
    expect(accionDeEquipo('dueno', armando, { persona_id: 'u-ex', rol: 'equipo', activo: false })).toBe('sumar');
    expect(accionDeEquipo('dueno', armando, { persona_id: armando, rol: 'dueno', activo: true })).toBeNull();
    expect(accionDeEquipo('dueno', armando, { persona_id: 'u-otro', rol: 'dueno', activo: true })).toBeNull();
    expect(accionDeEquipo('equipo', 'u-gabi', { persona_id: 'u-ana', rol: null, activo: null })).toBeNull();
    expect(accionDeEquipo('cliente', 'u-ana', { persona_id: 'u-otra', rol: null, activo: null })).toBeNull();
  });

  it('los territorios son los tres de la base', () => {
    expect(esTerritorio('mexico')).toBe(true);
    expect(esTerritorio('Mexico')).toBe(false);
  });
});
