/**
 * Renderer module
 * Handles rendering of 3D graphics
 */

export class Renderer {



  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('webgl');
    
    if (!this.context) {
      throw new Error('WebGL not supported');
    }
  }

  render() {
    if (this.context) {
      this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
    }
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    
    if (this.context) {
      this.context.viewport(0, 0, width, height);
    }
  }

  getContext() {
    return this.context;
  }

  dispose() {
    // Cleanup WebGL resources
  }
}