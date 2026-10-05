Una fila de ajuste. La explicación gris es la ayuda: no hay tooltips.

```jsx
<FilaAjuste
  nombre={t('settings.notifications.activity')}
  explicacion={t('settings.notifications.activity.d')}
  guardadoEn={guardadoEn}           // la pantalla lo cambia cuando el servidor confirmó
  textoGuardado={t('settings.saved')}
>
  <Switch checked={activo} onChange={cambiar} />
</FilaAjuste>
```

- Interruptores y selectores guardan solos. Los formularios (nombre, correo) llevan un `Boton` «GUARDAR» que se habilita solo cuando algo cambió.
