La pantalla P5 entera, menos el título: los códigos, las tres formas de guardarlos y el botón de salida.

```jsx
<CodigosRespaldo
  codigos={codigos}
  textos={{ descargar: t('auth.backup.download'), copiar: t('auth.backup.copy'), compartir: t('auth.backup.share'), listo: t('auth.backup.done') }}
  onListo={() => navegar('/inicio')}
/>
```

- «Listo» queda deshabilitado hasta que se descargue, copie o comparta. No hay otra forma de habilitarlo.
