import { defineConfig } from 'vitest/config';

/* En este repo corren las pruebas del paquete y las del núcleo que no necesitan
   la app (el título de entrada). El resto de los tests del núcleo importan la
   config de la app (`../acceso.config`) o NestJS: corren en cada app, donde el
   núcleo está instalado. */
export default defineConfig({
  test: {
    include: ['*.test.js', 'nucleo/frontend/titulo-de-entrada.test.ts'],
  },
});
