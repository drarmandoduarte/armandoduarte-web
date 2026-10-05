El botón de Google de la pantalla de entrada. Va arriba de todo, separado del correo por `Separador`.

```jsx
<BotonGoogle onClick={entrarConGoogle}>{t('auth.google')}</BotonGoogle>
```

- Si la app corre instalada en el celular, el correo va arriba y Google abajo (regla E1 del kit de acceso): lo decide la pantalla, no el botón.
