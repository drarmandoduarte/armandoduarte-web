Decisión que interrumpe: confirmar una urgencia, cerrar una ficha, anular un cobro.

```jsx
<Dialog open title="Marcar a Bruno Aldecoa como urgencia" description="Pasa al principio del tablero y avisa a la Dra. Silva."
  onClose={close} footer={<><Button variant="ghost" onClick={close}>Cancelar</Button><Button variant="danger">Marcar urgencia</Button></>} />
```

- Es de las poquísimas superficies con sombra en el molde (`--shadow-dialog`), porque flota de verdad.
