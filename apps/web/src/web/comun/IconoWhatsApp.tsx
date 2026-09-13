/**
 * El icono de WhatsApp, tal cual venía en el HTML estático: un trazo de 1.6,
 * sin relleno, que hereda el color del texto. No es de Lucide —el design system
 * usa Lucide para la app— porque este dibujo es el de la marca de WhatsApp
 * simplificado y ya estaba medido en los botones.
 */
export function IconoWhatsApp() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.5 11.6a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.4-4.4A8.5 8.5 0 1 1 20.5 11.6Z" />
      <path d="M9 9.2c.2 2.4 2.7 4.9 5.2 5.2l1.2-1.2-1.7-1-1 .7c-.8-.3-1.6-1.1-1.9-1.9l.7-1-1-1.7L9 9.2Z" />
    </svg>
  );
}
