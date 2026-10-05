import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  containerStyle?: React.CSSProperties;
}
export declare function Textarea(props: TextareaProps): React.JSX.Element;
