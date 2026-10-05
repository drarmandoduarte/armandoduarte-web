El título de toda pantalla del molde: sans, una palabra en la serif de la app en cursiva y acento, punto final.

```jsx
<Titulo texto={t('auth.totp.title')} />            // «Verifica tu *identidad*.»
<Titulo texto={design.app.frase} tamano="portada" /> // la frase de marca en la entrada
<Titulo texto="Uso de *IA*" tamano="bloque" como="h2" />
```

- La palabra acentuada se marca con asteriscos en el texto (la convención de los archivos de idioma). Nunca se arma con `<em>` a mano.
- Dos o tres palabras. Si hace falta más, va al subtítulo.
- El punto final va fuera de los asteriscos: es de la tinta, no del acento.
