/// <reference types="react" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ui-nav-menu": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "ui-title-bar": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        title?: string;
      };
    }
  }
}

export {};
