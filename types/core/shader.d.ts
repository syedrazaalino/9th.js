/**
 * Shader Type Definitions
 * Shader program management
 */

export interface ShaderUniform {
    value: any;
    type: string;
    name: string;
    isVector: boolean;
    isMatrix: boolean;
    isArray: boolean;
    size: number;
    length: number;
}

export interface ShaderAttribute {
    name: string;
    type: string;
    location: number;
    size: number;
}

export interface ShaderOptions {
    vertexShader: string;
    fragmentShader: string;
    uniforms?: { [name: string]: any };
    attributes?: { [name: string]: number };
    defines?: { [name: string]: string };
    transformFeedbackVaryings?: string[];
}

/**
 * Shader - Shader program wrapper
 */
export declare class Shader {
    public id: string;
    public uuid: string;
    public name: string;
    public type: string;
    public vertexShader: string;
    public fragmentShader: string;
    public program: WebGLProgram | null;
    public uniforms: { [name: string]: ShaderUniform };
    public attributes: { [name: string]: ShaderAttribute };
    public defines: { [name: string]: string };
    public isShader: boolean;
    public isRawShaderMaterial: boolean;

    constructor(options: ShaderOptions);

    /**
     * Compile shader
     */
    compile(gl: WebGLRenderingContext): void;

    /**
     * Get uniform location
     */
    getUniformLocation(gl: WebGLRenderingContext, name: string): WebGLUniformLocation | null;

    /**
     * Get attribute location
     */
    getAttributeLocation(gl: WebGLRenderingContext, name: string): number;

    /**
     * Set uniform value
     */
    setUniformValue(name: string, value: any): void;

    /**
     * Get uniform value
     */
    getUniformValue(name: string): any;

    /**
     * Set uniform array
     */
    setUniformArray(name: string, array: any[]): void;

    /**
     * Set uniform matrix
     */
    setUniformMatrix(name: string, matrix: any): void;

    /**
     * Set uniform vector
     */
    setUniformVector(name: string, vector: any): void;

    /**
     * Set uniform float
     */
    setUniformFloat(name: string, value: number): void;

    /**
     * Set uniform int
     */
    setUniformInt(name: string, value: number): void;

    /**
     * Set uniform bool
     */
    setUniformBool(name: string, value: boolean): void;

    /**
     * Update uniforms
     */
    updateUniforms(): void;

    /**
     * Get vertex shader
     */
    getVertexShader(): string;

    /**
     * Get fragment shader
     */
    getFragmentShader(): string;

    /**
     * Set vertex shader
     */
    setVertexShader(shader: string): void;

    /**
     * Set fragment shader
     */
    setFragmentShader(shader: string): void;

    /**
     * Check if uniform exists
     */
    hasUniform(name: string): boolean;

    /**
     * Get uniform names
     */
    getUniformNames(): string[];

    /**
     * Get attribute names
     */
    getAttributeNames(): string[];

    /**
     * Set defines
     */
    setDefines(defines: { [name: string]: string }): void;

    /**
     * Add define
     */
    addDefine(name: string, value?: string): void;

    /**
     * Remove define
     */
    removeDefine(name: string): void;

    /**
     * Clone shader
     */
    clone(): Shader;

    /**
     * Dispose shader
     */
    dispose(): void;
}