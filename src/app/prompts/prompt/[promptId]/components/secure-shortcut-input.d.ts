import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'secure-shortcut-input': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
