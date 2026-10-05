El selector que además sabe dar de alta lo que le falta.

```jsx
<SelectorConAlta
  label="A quién"
  placeholder="Elige a quién"
  options={contrapartes.map((c) => ({ value: c.id, label: c.nombre }))}
  value={aQuien}
  onChange={setAQuien}
  sinOpcionesTexto="Todavía no hay ningún laboratorio cargado."
  puedeAgregar={puede.darDeAltaFichas}
  agregar={{ opcion: t('comun.agregarNuevo'), titulo: t('proveedores.nuevo'), accion: t('comun.agregar'), guardando: t('comun.agregando'), cancelar: t('comun.cancelar') }}
  onAbrirAlta={() => setNombreNuevo('')}
  formulario={<Input label="Nombre" value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />}
  onAgregar={async () => {
    if (!nombreNuevo.trim()) return undefined;          // deja el bloque abierto
    const p = await crearProveedor(cuentaId, { nombre: nombreNuevo, tipo: 'estudios' });
    return { value: p.id, label: p.nombre };
  }}
/>
```

- **Es el `Selector` de la casa envuelto**, no otro selector: hereda su modo por tamaño, su
  teclado y sus textos de vacío. Lo que agrega es una opción al final de la lista y un bloque
  debajo.
- **El alta aparece DEBAJO, no en lugar del campo** — la anatomía que estrenó `ComboSugerido`
  (ya enterrado) y que aquí sobrevive, por la misma razón: quien eligió «Agregar nuevo»
  por error vuelve sin perder lo escrito.
- **Lo recién creado queda elegido sin esperar al padre.** Entre el `onAgregar` y la recarga de
  la lista el campo mostraría un hueco, y quien acaba de escribir un nombre creería que no se
  guardó y lo escribiría de nuevo.
- **`onAgregar` que devuelve `undefined` no cierra nada.** Es lo que hace una validación que no
  pasó: el bloque se queda abierto con lo escrito. Lo que lanza, se muestra adentro.
- **`puedeAgregar` en `false` deja un `Selector` común.** En una app del molde crear una ficha de proveedor
  o de profesional es del dueño y solo del dueño (`es_dueno_de()`, `0008` y `0011`): para un
  administrador la opción sería un botón que se estrella contra un 42501.
- **Los dos botones son `type="button"`.** El bloque vive dentro del formulario del diálogo, y
  un botón sin tipo dentro de un `<form>` es un submit: agregar un proveedor guardaría la salida.
- Los textos llegan traducidos. `packages/ui` no sabe de idiomas.
