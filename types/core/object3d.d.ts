/**
 * Object3D Type Definitions
 * Base class for 3D objects with transformation
 */

import { Vector3 } from './math/vector3';
import { Matrix4 } from './math/matrix4';
import { Euler } from './euler';

/**
 * Object3D - Base class for 3D objects
 */
export declare class Object3D {
    public id: string;
    public uuid: string;
    public name: string;
    public type: string;
    public parent: Object3D | null;
    public children: Object3D[];
    
    // Transform properties
    public position: Vector3;
    public rotation: Euler;
    public quaternion: any;
    public scale: Vector3;
    public matrix: Matrix4;
    public matrixWorld: Matrix4;
    public matrixAutoUpdate: boolean;
    public matrixWorldNeedsUpdate: boolean;
    
    // Visibility and rendering
    public visible: boolean;
    public castShadow: boolean;
    public receiveShadow: boolean;
    public frustumCulled: boolean;
    public renderOrder: number;
    public layers: number;
    
    // LOD and animation
    public userData: any;
    public dynamic: boolean;

    constructor();

    // Transform methods
    applyMatrix4(matrix: Matrix4): void;
    applyQuaternion(quaternion: any): void;
    setRotationFromAxisAngle(axis: Vector3, angle: number): void;
    setRotationFromEuler(euler: Euler): void;
    setRotationFromMatrix(matrix: Matrix4): void;
    setRotationFromQuaternion(quaternion: any): void;
    rotateOnAxis(axis: Vector3, angle: number): Object3D;
    rotateOnWorldAxis(axis: Vector3, angle: number): Object3D;
    rotateX(angle: number): Object3D;
    rotateY(angle: number): Object3D;
    rotateZ(angle: number): Object3D;
    translateOnAxis(axis: Vector3, distance: number): Object3D;
    translateX(distance: number): Object3D;
    translateY(distance: number): Object3D;
    translateZ(distance: number): Object3D;
    localToWorld(vector: Vector3): Vector3;
    worldToLocal(vector: Vector3): Vector3;
    lookAt(x: Vector3 | number, y?: number, z?: number): void;
    
    // Hierarchy methods
    add(object: Object3D): Object3D;
    remove(object: Object3D): void;
    removeFromParent(): void;
    clear(): void;
    attach(object: Object3D): Object3D;
    
    // Update methods
    updateMatrix(): void;
    updateMatrixWorld(force?: boolean): void;
    updateWorldMatrix(updateParents?: boolean, updateChildren?: boolean): void;
    updateMatrixChildren(): void;
    updateMatrixWorldChildren(force?: boolean): void;
    updateProjectionMatrix(): void;
    
    // World transform methods
    getWorldPosition(target: Vector3): Vector3;
    getWorldQuaternion(target: any): any;
    getWorldScale(target: Vector3): Vector3;
    getWorldDirection(target: Vector3): Vector3;
    
    // Raycasting
    raycast(raycaster: any, intersects: any[]): void;
    
    // Utility methods
    getObjectById(id: string): Object3D | undefined;
    getObjectByName(name: string): Object3D | undefined;
    getObjectByProperty(name: string, value: any): Object3D | undefined;
    getWorldMatrix(): Matrix4;
    getMatrix(): Matrix4;
    getWorldPositionVector3(): Vector3;
    
    // Animation methods
    onBeforeRender(renderer: any, scene: any, camera: any, geometry: any, material: any, group: any): void;
    onAfterRender(renderer: any, scene: any, camera: any, geometry: any, material: any, group: any): void;
    
    // User data
    getUserData(): any;
    setUserData(data: any): void;
    
    // Disposal
    dispose(): void;
    
    // Cloning
    clone(recursive?: boolean): Object3D;
    copy(source: Object3D, recursive?: boolean): Object3D;
}

/**
 * Euler - Euler angle representation for rotations
 */
export declare class Euler {
    public x: number;
    public y: number;
    public z: number;
    public order: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';

    constructor(x?: number, y?: number, z?: number, order?: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX');

    set(x: number, y: number, z: number, order?: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX'): Euler;
    copy(source: Euler): Euler;
    setFromRotationMatrix(m: Matrix4, order?: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX'): Euler;
    setFromQuaternion(q: any, order?: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX'): Euler;
    reorder(newOrder: 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX'): Euler;
    equals(euler: Euler): boolean;
    toArray(): number[];
    toArray3(): [number, number, number];
    fromArray(array: number[], offset?: number): Euler;
    clone(): Euler;
}