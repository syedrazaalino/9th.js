/**
 * Materials module
 * Surface properties and shaders for 3D objects
 */

export interface Material {
  render(): void;
  dispose(): void;
}

export class BasicMaterial implements Material {
  public color: string;
  public opacity: number;
  public transparent: boolean;

  constructor(options: { color?: string; opacity?: number; transparent?: boolean } = {}) {
    this.color = options.color || '#ffffff';
    this.opacity = options.opacity || 1.0;
    this.transparent = options.transparent || false;
  }

  public render(): void {
    // Basic material rendering implementation
    console.log(`Rendering material with color: ${this.color}, opacity: ${this.opacity}`);
  }

  public dispose(): void {
    // Cleanup material resources
  }
}

export class PhongMaterial extends BasicMaterial {
  public shininess: number;
  public specular: string;

  constructor(options: {
    color?: string;
    opacity?: number;
    transparent?: boolean;
    shininess?: number;
    specular?: string;
  } = {}) {
    super({
      color: options.color,
      opacity: options.opacity,
      transparent: options.transparent
    });

    this.shininess = options.shininess || 30;
    this.specular = options.specular || '#ffffff';
  }
}