/**
 * La hora de pared de una zona, y el instante que le corresponde — D15.
 *
 * Una edición se guarda como **instante** (`timestamptz`) y **zona IANA**
 * (`America/Merida`), nunca como un offset: el offset cambia con el horario de
 * verano y la zona no. Lo que el equipo escribe en el panel es la hora de pared
 * —«5 de noviembre, 8:30, en Mérida»— y lo que ve la persona es esa misma hora,
 * y la suya al lado si vive en otra zona. Este archivo hace las dos
 * conversiones con `Intl`, sin dependencias.
 *
 * El formato de la hora de pared es el de un `<input type="datetime-local">`:
 * `AAAA-MM-DDTHH:mm`.
 */

const HORA_DE_PARED = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** ¿Es una zona IANA que el motor conoce? `Intl` tira `RangeError` si no. */
export function esZonaValida(zona: string): boolean {
  if (!zona || /^[+-]?\d/.test(zona) || /^(utc|gmt)[+-]/i.test(zona)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

/** Las partes de un instante vistas en una zona. */
function partesEn(ms: number, zona: string) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms));
  const de = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  return { anio: de('year'), mes: de('month'), dia: de('day'), hora: de('hour'), minuto: de('minute'), segundo: de('second') };
}

/** Cuántos minutos le lleva la hora de pared de `zona` al UTC en ese instante. */
function desfaseEn(ms: number, zona: string): number {
  const p = partesEn(ms, zona);
  const comoUtc = Date.UTC(p.anio, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return Math.round((comoUtc - Math.floor(ms / 1000) * 1000) / 60_000);
}

/**
 * «8:30 del 5 de noviembre en Mérida» → el instante, en ISO UTC.
 *
 * Devuelve `null` si la hora de pared no tiene forma o la zona no existe.
 * Se corrige dos veces el desfase porque el de la primera suposición puede ser
 * el del otro lado de un cambio de horario.
 */
export function instanteDesdeHoraDePared(local: string, zona: string): string | null {
  const m = HORA_DE_PARED.exec(local);
  if (!m || !esZonaValida(zona)) return null;
  const [anio, mes, dia, hora, minuto] = m.slice(1).map(Number);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || hora > 23 || minuto > 59) return null;
  const supuesto = Date.UTC(anio, mes - 1, dia, hora, minuto);
  let ms = supuesto - desfaseEn(supuesto, zona) * 60_000;
  ms = supuesto - desfaseEn(ms, zona) * 60_000;
  /* Una fecha que no existe (31 de febrero) vuelve con otro día: se rechaza. */
  if (horaDeParedDe(new Date(ms).toISOString(), zona) !== local) return null;
  return new Date(ms).toISOString();
}

/** El instante visto como hora de pared de `zona`, en el formato del campo. */
export function horaDeParedDe(instante: string, zona: string): string | null {
  const ms = Date.parse(instante);
  if (Number.isNaN(ms) || !esZonaValida(zona)) return null;
  const p = partesEn(ms, zona);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${p.anio}-${dos(p.mes)}-${dos(p.dia)}T${dos(p.hora)}:${dos(p.minuto)}`;
}

/**
 * «jueves, 5 de noviembre de 2026, 8:30» en la zona de la edición.
 *
 * `idioma` es un BCP 47 (`es-MX`). La fecha se escribe en la zona que se pide,
 * no en la del navegador: es lo que hace que la persona en Madrid lea la hora de
 * Mérida cuando la pantalla dice «en Mérida».
 */
export function fechaLarga(instante: string, zona: string, idioma = 'es-MX'): string {
  const fecha = new Intl.DateTimeFormat(idioma, {
    timeZone: zona, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(instante));
  return `${fecha}, ${horaCorta(instante, zona)}`;
}

/**
 * «8:30» o «13:00» en la zona que se pide: 24 horas y sin cero adelante, como
 * escribe la web («8:30 a 13:00»). `Intl` en `es-MX` pondría «8:30 a.m.», y con
 * `h23` «08:30»; por eso se arma con las partes.
 */
export function horaCorta(instante: string, zona: string): string {
  const p = partesEn(Date.parse(instante), zona);
  return `${p.hora}:${String(p.minuto).padStart(2, '0')}`;
}

/** «30 sept 2026, 14:05» en la zona que se pide: para tablas, donde el día de la semana sobra. */
export function fechaCorta(instante: string, zona: string, idioma = 'es-MX'): string {
  const fecha = new Intl.DateTimeFormat(idioma, { timeZone: zona, day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(instante));
  return `${fecha}, ${horaCorta(instante, zona)}`;
}

/** El nombre corto de la ciudad de una zona IANA: `America/Merida` → `Merida`. */
export function ciudadDeZona(zona: string): string {
  return (zona.split('/').pop() ?? zona).replace(/_/g, ' ');
}
