/**
 * eslint en Códice: UNA regla, y heredada con su caso.
 *
 * ── Por qué existe este archivo y por qué tiene una sola regla ─────────────
 * La casa prefiere guardianes que fijan una decisión con su caso al lado antes
 * que un linter que discute comas. Lo que entra igual es el tipo de defecto que
 * **ninguna de las comprobaciones de la casa puede ver**: un hook llamado dentro
 * de un `if`, dentro de un bucle o después de un `return` cambia la cuenta de
 * hooks entre renders y React tira el #310 con la pantalla entera.
 *
 * El caso no es de acá, es de Omnia —8/9/2026, producción caída entera por un
 * `useMomentoDelDia()` puesto después de dos `return`— y se hereda porque el
 * defecto es del lenguaje, no de aquella app: `pnpm test`, `typecheck`,
 * `check:i18n`, `check:tuteo` y `build` pasaron los cinco en verde y tenían
 * razón. No es un test que falta ni un tipo mal puesto: es una regla de React
 * que solo un analizador del árbol sintáctico puede mirar.
 *
 * ── Alcance declarado, que es la mitad del valor ───────────────────────────
 * **Una sola regla, `react-hooks/rules-of-hooks`, y como error.** No entran
 * `exhaustive-deps` ni ninguna regla de estilo. El día que la casa quiera otra,
 * se agrega acá con su caso al lado.
 *
 * **Dónde mira:** `apps/web/src` y `packages/ui/components`, que es donde vive
 * React. `packages/core` no dibuja nada y `packages/prompts` tampoco.
 */
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.vitest-report.json'] },
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'packages/ui/components/**/*.{js,jsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error' },
  },
];
