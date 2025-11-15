/**
 * Renderer module
 * Handles rendering of 3D graphics
 */

export class Renderer {
  private canvas: HTMLCanvasElement;
  private context: WebGLRenderingContext | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('webgl');
    
    if (!this.context) {
      throw new Error('WebGL not supported');
    }
  }

  public render(): void {
    if (this.context) {
      this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
    }
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.context) {
      this.context.viewport(0, 0, width, height);
    }
  }

  public getContext(): WebGLRenderingContext | null {
    return this.context;
  }

  public dispose(): void {
    // Cleanup WebGL resources
  }
}