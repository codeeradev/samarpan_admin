declare module "react-summernote" {
  import { ComponentType, CSSProperties } from "react";

  export interface ReactSummernoteProps {
    value?: string;
    options?: Record<string, unknown>;
    onChange?: (content: string) => void;
    onImageUpload?: (files: File[]) => void;
    onInit?: (event: any) => void;
    className?: string;
    style?: CSSProperties;
  }

  const ReactSummernote: ComponentType<ReactSummernoteProps>;
  export default ReactSummernote;
}

declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}
