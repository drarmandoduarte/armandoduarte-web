El campo de las pantallas de acceso y de Ajustes: etiqueta en mayúsculas encima, 56 px de alto.

```jsx
<Campo etiqueta={t('auth.email.label')} type="email" placeholder={t('auth.email.placeholder')} autoComplete="email" />
<Campo etiqueta={t('settings.profile.name')} value={nombre} onChange={…} error={errorNombre} />
```

- Para formularios de trabajo de la app (densos) usá `Field` + `Input`.
