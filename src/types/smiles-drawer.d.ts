declare module 'smiles-drawer' {
  export interface DrawerOptions {
    width?: number;
    height?: number;
  }

  export class Drawer {
    constructor(options?: DrawerOptions);
    draw(tree: unknown, canvas: HTMLCanvasElement, themeName?: string, infoOnly?: boolean): void;
  }

  export function parse(smiles: string, success: (tree: unknown) => void, error?: (message: string) => void): void;

  const SmilesDrawer: {
    Drawer: typeof Drawer;
    parse: typeof parse;
  };

  export default SmilesDrawer;
}
