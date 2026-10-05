El botón de contorno de las pantallas del molde (acceso, ajustes, asistente).

```jsx
<Boton flecha onClick={enviar}>{t('auth.login.send')}</Boton>          // ENVIAR CÓDIGO →
<Boton ancho="completo" cargando={verificando}>{t('auth.totp.verify')}</Boton>
<Boton variante="peligro">{t('settings.data.delete')}</Boton>
```

- Contorno del acento, texto en mayúsculas espaciadas. Nunca relleno.
- En la entrada va del ancho de su texto; en las pantallas de código, `ancho="completo"`.
- Para el trabajo diario de la app (guardar, crear) está `Button`, que es relleno.
