/**
 * El `Event` de `/matrimonios` dice lo mismo que la página — orden Códice #38.
 *
 * El hermano de `el-evento-de-merida-dice-la-verdad.test.ts`, por la misma
 * razón: el bloque no se ve, y lo que dice es lo que Google publica. Comprueba
 * que exista y parsee, que sea en línea con un `VirtualLocation` que apunta a
 * la página, que la fecha y la hora sean las de la banda de hechos —el día de
 * la semana y el huso **calculados**, no copiados— y que el precio sea el del
 * cierre, con la descripción literal de la orden.
 *
 * Lo que NO comprueba: que Google lo acepte (eso es el Rich Results Test, en el
 * informe), ni que los seis meses estén en las fechas: la orden fija la de la
 * primera sesión.
 */
import { describe, expect, it } from 'vitest';
import { RECURSOS_I18N } from '@codice/core';
import { cabezaHtml, type Pagina } from './web/comun/cabeza';

function datosDe(pagina: Pagina): unknown[] {
  return [...cabezaHtml(pagina).matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)]
    .map(([, cuerpo]) => JSON.parse(cuerpo) as unknown);
}

/** El desplazamiento de CDMX ese instante, en forma ISO 8601 (`-06:00`). */
function husoDeCdmx(fecha: Date): string {
  const nombre = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', timeZoneName: 'longOffset' })
    .formatToParts(fecha).find((p) => p.type === 'timeZoneName')?.value ?? '';
  return nombre.replace('GMT', '') || '+00:00';
}

interface Evento {
  '@type': string;
  name: string;
  startDate: string;
  endDate: string;
  eventAttendanceMode: string;
  location: { '@type': string; url: string };
  organizer: { name: string };
  offers: { price: number; priceCurrency: string; description: string };
}

const m = (RECURSOS_I18N.es.web as unknown as Record<string, Record<string, Record<string, string>>>).matrimonios;

describe('el Event de schema.org de /matrimonios', () => {
  it('piso · hay uno, parsea, y es un Event', () => {
    const datos = datosDe('matrimonios');
    expect(datos, 'el Event tiene que estar en /matrimonios').toHaveLength(1);
    expect((datos[0] as Evento)['@type']).toBe('Event');
    /* Y no se coló en las otras: la portada y las legales no tienen ninguno, y
       `/merida` sigue con el suyo y solo el suyo. */
    for (const pagina of ['inicio', 'privacidad', 'terminos'] as Pagina[]) expect(datosDe(pagina), pagina).toHaveLength(0);
    expect((datosDe('taller')[0] as Evento).name).not.toBe((datos[0] as Evento).name);
  });

  it('en línea, con la página como lugar', () => {
    const [e] = datosDe('matrimonios') as Evento[];
    expect(e.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(e.location).toEqual({ '@type': 'VirtualLocation', url: 'https://armandoduarte.com/matrimonios' });
    expect(e.organizer.name).toBe('Armando Duarte');
  });

  it('jueves 29/10/2026, 19:00 a 21:00 de CDMX: el huso y el día se calculan', () => {
    const [e] = datosDe('matrimonios') as Evento[];
    expect(e.startDate).toBe('2026-10-29T19:00:00-06:00');
    expect(e.endDate).toBe('2026-10-29T21:00:00-06:00');
    for (const marca of [e.startDate, e.endDate]) {
      expect(marca.slice(-6), `el huso de ${marca} no es el de CDMX ese día`).toBe(husoDeCdmx(new Date(marca)));
    }
    /* La banda de hechos dice «Jueves 29 de octubre de 2026»: el día de la
       semana que publica la página es el que cae esa fecha en CDMX. */
    const dia = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(e.startDate));
    expect(dia.toLowerCase()).toBe(m.hechos.iniciaValor.toLowerCase().replace('jueves ', 'jueves, '));
    /* Y la hora: «7:00 a 9:00 pm (hora de CDMX)». */
    const hora = (iso: string) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
    expect(`${hora(e.startDate)} a ${hora(e.endDate)}`.replace(/\s?PM/g, '').concat(' pm (hora de CDMX)')).toBe(m.hechos.horarioValor);
  });

  it('el precio es el del cierre, y la descripción la de la orden', () => {
    const [e] = datosDe('matrimonios') as Evento[];
    const delCierre = Number(m.cierre.inversionValor.match(/^\$([\d,]+) MXN/)![1].replace(/,/g, ''));
    expect(e.offers.price).toBe(delCierre);
    expect(e.offers.priceCurrency).toBe('MXN');
    expect(e.offers.description).toBe('Por pareja, 6 mensualidades');
  });
});
