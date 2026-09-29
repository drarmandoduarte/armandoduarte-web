/**
 * @codice/api — la API de Mi espacio.
 *
 * Lo que este paquete exporta es una **fábrica**, no un servidor escuchando: la
 * app se sirve como función de Vercel (`apps/familia/api/index.ts`), que la crea
 * una vez y la reusa entre invocaciones calientes. Un `listen()` acá adentro
 * haría imposible eso.
 */
export { AppModule } from './app.module';
export { crearApp, manejadorHttp } from './servidor';
export { SupabaseService, variableObligatoria } from './identidad/supabase.service';
