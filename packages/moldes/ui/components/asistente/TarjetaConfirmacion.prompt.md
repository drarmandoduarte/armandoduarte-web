La tarjeta que el asistente muestra antes de hacer algo. Sin ella, el asistente no hace.

```jsx
<TarjetaConfirmacion
  accion={t('asistente.voyA', { accion: 'mandar el recordatorio a 3 personas' })}
  vista={<ListaDeDestinatarios … />}
  irreversible={false}
  textos={{ confirmar: t('asistente.confirmar'), no: t('asistente.no'), codigo: t('auth.code.label') }}
  onConfirmar={ejecutar} onCancelar={descartar}
/>
```
