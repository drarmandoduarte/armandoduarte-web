/**
 * @codice/ui — el design system.
 *
 * **Hoy no exporta ningún componente, y no es un olvido.**
 *
 * La regla de qué sube acá: un componente vive en `packages/ui` cuando lo
 * comparten **dos productos** —la web, el consultorio, la academia, el
 * asistente—, no cuando lo comparten dos pantallas del mismo producto. Lo que
 * comparten las cuatro páginas de la web pública vive en
 * `apps/web/src/web/comun/`, que es su casa.
 *
 * Hoy hay un solo producto, así que subir algo sería adivinar cómo lo va a
 * necesitar el segundo. Una carpeta de componentes que se llena por adelantado
 * se llena de suposiciones, y una suposición en un design system la paga cada
 * pantalla que la hereda.
 *
 * Lo que este paquete sí da hoy, y es lo que importa: los **tokens**
 * (`@codice/ui/styles`) y las **fuentes locales** (`@codice/ui/fuentes`). Se
 * consumen por CSS, no por JavaScript, y son **dos** entradas desde la orden
 * #09: el porqué de la división está en `LEEME.md`.
 */
export {};
