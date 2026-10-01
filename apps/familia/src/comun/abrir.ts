/**
 * Abrir en otra pestaña una URL que **se pide después del clic** — orden #27 C.
 *
 * El comprobante se ve con una URL firmada de 60 s que la API crea en el
 * momento. Si se abriera la pestaña recién cuando llega la URL, Safari y
 * Chrome la tratarían como ventana emergente (ya no hay clic en curso) y la
 * bloquearían. Así que la pestaña se abre **en el clic**, vacía, y se la manda
 * a la URL cuando llega; sin `opener`, para que la página de Storage no pueda
 * tocar esta. Si el navegador igual no dejó abrirla, se navega en la misma.
 *
 * Devuelve si se pudo; si pedir la URL falla, cierra la pestaña vacía.
 */
export async function abrirEnOtraPestana(pedirUrl: () => Promise<string>): Promise<boolean> {
  let ventana: Window | null = null;
  try {
    ventana = window.open('', '_blank');
  } catch {
    ventana = null;
  }
  try {
    const url = await pedirUrl();
    if (ventana) {
      ventana.opener = null;
      ventana.location.href = url;
    } else {
      window.location.assign(url);
    }
    return true;
  } catch {
    ventana?.close();
    return false;
  }
}
