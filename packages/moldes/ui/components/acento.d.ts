import * as React from 'react';
/** Parte «Verifica tu *identidad*.» en trozos con y sin acento. */
export declare function partirAcento(texto: string): Array<{ acento: boolean; texto: string }>;
/** Lo mismo, como nodos de React (la palabra acentuada en `<em>`). */
export declare function conAcento(texto: React.ReactNode): React.ReactNode;
