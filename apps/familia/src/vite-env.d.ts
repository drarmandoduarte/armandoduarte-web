/// <reference types="vite/client" />

/**
 * Las variables que esta app lee del entorno, tipadas.
 *
 * Están declaradas para que `import.meta.env.VITE_SUPABASE_URL` sea `string |
 * undefined` y no `any`: la regla de la casa es «nunca `any`», y el objeto
 * `env` de Vite es exactamente uno de esos bordes externos donde se cuela sin
 * que nadie lo note.
 *
 * **Acá van nombres, nunca valores.** Este archivo se commitea.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
