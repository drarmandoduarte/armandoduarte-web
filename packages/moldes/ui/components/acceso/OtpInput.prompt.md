La casilla de 6 huecos. Obligatoria para todo código de 6 dígitos: el del mail y el del autenticador. Nunca un campo largo.

```jsx
const ref = useRef(null);
<Antetitulo texto={t('auth.code.label')} tono="apagado" />
<OtpInput
  ref={ref}
  value={codigo}
  onChange={setCodigo}
  onCompleto={verificar}          // verifica sola al llenar la sexta
  error={fallo}
  aria-label={t('auth.code.label')}
/>
// si el servidor dice que no:
setFallo(true); ref.current.reset();   // tiembla, se vacía, foco a la primera
```

- El botón «VERIFICAR» queda igual debajo (accesibilidad, y para quien no confía en lo automático).
- El mensaje de error («Código incorrecto. Te quedan N intentos.») lo pone la pantalla debajo, en el color del error. Nunca más que eso.
- Los códigos de respaldo (10 caracteres) van en `CampoMono`, no acá.
