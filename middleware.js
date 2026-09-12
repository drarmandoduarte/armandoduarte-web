// Cortina de «muy pronto»: mientras la web no está abierta, todo el tráfico sin
// código ve /cortina.html. Este archivo se borra en la apertura (orden #06).

export const config = {
  matcher: ['/((?!fuentes/|img/|estilo\\.css|favicon|apple-touch-icon|robots\\.txt|sitemap\\.xml|cortina(\\.html)?$).*)'],
};

export default async function middleware(request) {
  const codigo = process.env.CODIGO_ACCESO;
  const url = new URL(request.url);

  // Sin variable de entorno no se abre nada: falla cerrado.
  if (codigo) {
    const galleta = (request.headers.get('cookie') || '').split(';')
      .map((c) => c.trim()).find((c) => c.startsWith('acceso='));
    if (galleta && galleta.slice(7) === codigo) return; // ya entró: sigue a la página real

    if (url.pathname === '/entrar' && url.searchParams.get('codigo') === codigo) {
      return new Response(null, {
        status: 302,
        headers: {
          location: '/',
          'set-cookie': `acceso=${codigo}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
  }

  // Todo lo demás, incluido /entrar con código incorrecto: la cortina, y nada
  // que delate que /entrar existe. 200 porque no es un error, es una página.
  const r = await fetch(new URL('/cortina.html', request.url));
  return new Response(r.body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
      'cache-control': 'no-store',
    },
  });
}
