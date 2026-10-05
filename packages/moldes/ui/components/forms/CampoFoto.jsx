import React from 'react';
import { Field } from './Field.jsx';
import { Button } from '../core/Button.jsx';
import { Icon } from '../core/Icon.jsx';
import { AvatarPersona } from '../persona/AvatarPersona.jsx';

/* La foto, elegida y encuadrada.

   DOS PUERTAS, NO UNA. «Subir foto» abre el explorador; «Cámara» abre la cámara
   del teléfono —es el mismo `<input type=file>` con `capture`, que en el móvil
   saltea el carrete y en el escritorio, donde `capture` no existe, se comporta
   igual que el otro—. Dos botones y no uno con menú: quien tiene a la persona
   delante en el mostrador toca «Cámara» y ya está sacando la foto.

   EL RECORTE ES CUADRADO Y ES LO ÚNICO QUE SE PUEDE HACER. Se arrastra para
   mover y se acerca con la barra; no hay rotar, ni filtros, ni relación de
   aspecto. La razón es que el cuadrado es la forma en que la foto se ve después
   —lista, tarjeta, tablero y ficha—, así que quien
   encuadra está viendo exactamente lo que va a quedar. Un recortador que ofrece
   más obliga a decidir más, y esto pasa veinte veces por día.

   ESTE COMPONENTE NO COMPRIME NI SUBE NADA. Entrega el archivo original y el
   encuadre elegido; convertir eso en un cuadrado de ~200 KB y ponerlo en
   Storage es trabajo de datos, no de diseño, y vive en la app —donde además se
   puede probar—. */

const LADO = 220;
const ZOOM_MAX = 4;

export function CampoFoto({
  label, hint, error, required, disabled = false,
  valorUrl, nombre = '', onArchivo, onQuitar,
  textos = {}, style, ...rest
}) {
  const [origen, setOrigen] = React.useState(null); // { url, archivo, w, h }
  const [zoom, setZoom] = React.useState(1);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const arrastre = React.useRef(null);
  const subirRef = React.useRef(null);
  const camaraRef = React.useRef(null);

  // El object URL de la foto elegida es memoria del navegador: si no se suelta
  // al cerrar el recorte, cada intento deja un archivo entero colgado.
  React.useEffect(() => () => { if (origen) URL.revokeObjectURL(origen.url); }, [origen]);

  const elegir = (evento) => {
    const archivo = evento.target.files && evento.target.files[0];
    evento.target.value = ''; // para que elegir el MISMO archivo dos veces dispare igual
    if (!archivo) return;
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      // Arranca centrada. Sin esto, una foto apaisada abre mostrando su borde
      // izquierdo — que es donde nunca está la cara.
      const base = LADO / Math.min(w, h);
      setOrigen({ url, archivo, w, h });
      setZoom(1);
      setPos({ x: (LADO - w * base) / 2, y: (LADO - h * base) / 2 });
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  // Cuánto hay que agrandar la imagen para que el lado corto llene el cuadrado.
  const escalaBase = origen ? LADO / Math.min(origen.w, origen.h) : 1;
  const escala = escalaBase * zoom;
  const ancho = origen ? origen.w * escala : 0;
  const alto = origen ? origen.h * escala : 0;

  // La imagen nunca deja ver el fondo: el desplazamiento se recorta contra los
  // bordes. Sin esto, un dedo de más deja media cara fuera.
  const acotar = (p, w, h) => ({
    x: Math.min(0, Math.max(LADO - w, p.x)),
    y: Math.min(0, Math.max(LADO - h, p.y)),
  });


  const empezar = (e) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const mover = (e) => {
    if (!arrastre.current) return;
    setPos(acotar({ x: e.clientX - arrastre.current.x, y: e.clientY - arrastre.current.y }, ancho, alto));
  };
  const soltar = () => { arrastre.current = null; };

  const cambiarZoom = (z) => {
    // Se acerca sobre el centro del cuadrado, no sobre la esquina: es lo que
    // hace que acercar no mande la cara fuera de cuadro.
    const previo = escalaBase * zoom;
    const nuevo = escalaBase * z;
    const centro = (v, largoPrevio, largoNuevo) => (v - LADO / 2) * (largoNuevo / largoPrevio) + LADO / 2;
    const w = origen.w * nuevo;
    const h = origen.h * nuevo;
    setZoom(z);
    setPos(acotar({
      x: centro(pos.x, origen.w * previo, w),
      y: centro(pos.y, origen.h * previo, h),
    }, w, h));
  };

  const confirmar = () => {
    if (!origen || !onArchivo) return;
    onArchivo(origen.archivo, {
      lado: LADO, zoom, x: pos.x, y: pos.y,
      naturalW: origen.w, naturalH: origen.h,
    });
    cerrar();
  };

  const cerrar = () => {
    setOrigen(null); // el `useEffect` de limpieza suelta el object URL
  };

  const entradas = [
    React.createElement('input', {
      key: 'sub', ref: subirRef, type: 'file', accept: 'image/*',
      onChange: elegir, style: { display: 'none' },
    }),
    React.createElement('input', {
      key: 'cam', ref: camaraRef, type: 'file', accept: 'image/*', capture: 'environment',
      onChange: elegir, style: { display: 'none' },
    }),
  ];

  return React.createElement(Field, { label, hint, error, required, style },
    origen
      ? React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' } },
        React.createElement('div', {
          onPointerDown: empezar, onPointerMove: mover,
          onPointerUp: soltar, onPointerCancel: soltar,
          style: {
            position: 'relative', width: LADO, height: LADO, overflow: 'hidden',
            borderRadius: 'var(--radius-md)', background: 'var(--surface-2)',
            touchAction: 'none', cursor: 'grab', userSelect: 'none',
          },
        },
          React.createElement('img', {
            src: origen.url, alt: '', draggable: false,
            style: {
              position: 'absolute', left: pos.x, top: pos.y,
              width: ancho, height: alto, maxWidth: 'none', display: 'block',
            },
          }),
        ),

        React.createElement('label', {
          style: { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', maxWidth: LADO },
        },
          React.createElement(Icon, { name: 'zoom-in', size: 14, style: { color: 'var(--text-3)' } }),
          React.createElement('input', {
            type: 'range', min: 1, max: ZOOM_MAX, step: 0.01, value: zoom,
            'aria-label': textos.zoom,
            onChange: (e) => cambiarZoom(Number(e.target.value)),
            style: { flex: 1, accentColor: 'var(--primary)' },
          }),
        ),

        React.createElement('p', {
          style: { fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-snug)', color: 'var(--text-3)', maxWidth: LADO },
        }, textos.ayudaEncuadre),

        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' } },
          React.createElement(Button, { type: 'button', size: 'sm', onClick: confirmar }, textos.recortar),
          React.createElement(Button, { type: 'button', size: 'sm', variant: 'ghost', onClick: cerrar }, textos.cancelar),
        ),
        entradas,
      )
      : React.createElement('div', {
        style: { display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }, ...rest,
      },
        React.createElement(AvatarPersona, { nombre, fotoUrl: valorUrl, size: 72 }),
        /* Los dos botones bajan de tono cuando todavía no hay foto.
           Una ficha vacía abre con el hueco de la cara arriba de todo, y con
           «Subir foto» y «Cámara» en secundario eso era lo primero que gritaba
           la pantalla — antes que el nombre, que es lo que de verdad hay que
           llenar. Con foto puesta vuelven a secundario: ahí ya no compiten con
           nada, y «Cambiar» es una acción que se busca a propósito.
           Es de la pieza y no de una pantalla: el mismo argumento vale en la
           ficha de la persona, que la usa igual. */
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' } },
          React.createElement(Button, {
            type: 'button', size: 'sm', variant: valorUrl ? 'secondary' : 'ghost', disabled,
            onClick: () => subirRef.current && subirRef.current.click(),
          }, valorUrl ? textos.cambiar : textos.subir),
          React.createElement(Button, {
            type: 'button', size: 'sm', variant: valorUrl ? 'secondary' : 'ghost', disabled,
            onClick: () => camaraRef.current && camaraRef.current.click(),
          }, textos.camara),
          valorUrl && onQuitar && React.createElement(Button, {
            type: 'button', size: 'sm', variant: 'ghost', disabled, onClick: onQuitar,
          }, textos.quitar),
        ),
        entradas,
      ),
  );
}
