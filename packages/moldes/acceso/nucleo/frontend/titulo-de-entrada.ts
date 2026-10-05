/**
 * KIT DE ACCESO · NÚCLEO (P1, la pantalla de entrada) — NO se edita en una app.
 *
 * Nuevo en 1.3.0: el título de la pantalla de entrada con la frase de marca en
 * tres idiomas (Dirección, 4/10/2026).
 *
 * La frase sale de `design.json → app.frase`: un texto (se toma como español) o
 * `{ es, en, pt }`. La regla:
 *   · si hay frase en el idioma de la pantalla, va esa;
 *   · si no, el título genérico del molde EN ESE IDIOMA («Entra a *{app}*.»,
 *     que la pantalla ya trae traducido en `generico`);
 *   · nunca la frase en otro idioma.
 *
 * Es la misma regla que `fraseDeMarca()` de `@moldes/design`, escrita acá sin
 * importarla porque el núcleo se copia solo a cada app. Un test del paquete
 * (`el-titulo-de-entrada-es-el-del-molde.test.js`) exige que las dos digan lo
 * mismo en todos los casos: si una cambia, el test avisa.
 */
export type Idioma = 'es' | 'en' | 'pt';
export type FraseDeMarca = string | Partial<Record<Idioma, string>> | undefined | null;

export function tituloDeEntrada(frase: FraseDeMarca, idioma: Idioma, generico: string): string {
  if (typeof frase === 'string') return idioma === 'es' ? frase : generico;
  if (frase && typeof frase[idioma] === 'string') return frase[idioma] as string;
  return generico;
}
