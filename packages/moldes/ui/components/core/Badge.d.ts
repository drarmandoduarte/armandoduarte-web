import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'primary' | 'warning' | 'info' | 'danger';
  /** Si se pasa, el badge se vuelve contador circular (bandeja de WhatsApp, pendientes). */
  count?: number;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): React.JSX.Element;
