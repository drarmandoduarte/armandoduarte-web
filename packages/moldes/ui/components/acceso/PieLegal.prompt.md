La frase legal al pie de la pantalla de entrada. Solo en P1.

```jsx
<PieLegal
  texto={t('auth.legal')}
  terminos={{ texto: t('auth.legal.terms'), href: '/terminos' }}
  privacidad={{ texto: t('auth.legal.privacy'), href: '/privacidad' }}
/>
```

- La frase se traduce entera; los dos trozos enlazados son subcadenas de ella en cada idioma.
