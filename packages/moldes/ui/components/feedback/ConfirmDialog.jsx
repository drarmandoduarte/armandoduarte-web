import React from 'react';
import { Dialog } from './Dialog.jsx';
import { Button } from '../core/Button.jsx';

/* Confirmación de dos botones sobre el Dialog del sistema.
   danger=true SOLO para acciones destructivas (borrar, dar de baja).
   confirmVariant manda por encima de danger, para el acto que deshace sin
   destruir: `danger-secondary` dice "esto revierte algo" sin gastar el relleno
   sólido del error, que en el molde es la urgencia. */
export function ConfirmDialog({
  open = false, title, description,
  confirmLabel, cancelLabel, closeLabel,
  danger = false, confirmVariant, loading = false,
  onConfirm, onCancel, children, ...rest
}) {
  return React.createElement(Dialog, {
    open, title, description, onClose: onCancel, closeLabel: closeLabel || cancelLabel, width: 420,
    footer: React.createElement(React.Fragment, null,
      React.createElement(Button, { variant: 'ghost', onClick: onCancel, disabled: loading }, cancelLabel),
      React.createElement(Button, { variant: confirmVariant || (danger ? 'danger' : 'primary'), onClick: onConfirm, disabled: loading }, confirmLabel)
    ),
    ...rest
  }, children);
}
