/**
 * SkeletalAnimation Type Definitions
 * Skeletal animation system
 */

import { Vector3 } from './math/vector3';
import { Quaternion } from './math/quaternion';

export interface Bone {
    name: string;
    index: number;
    parent: Bone | null;
    children: Bone[];
    position: Vector3;
    quaternion: Quaternion;
    scale: Vector3;
    matrix: any;
    matrixWorld: any;
    boneMatrices: Float32Array;
    boneMatrixIndex: number;
    skinIndex: string[];
    skinWeight: number[];
    positionInfluence: number;
    quaternionInfluence: number;
    scaleInfluence: number;
}

export interface Skeleton {
    bones: Bone[];
    boneInverses: any[];
    useVertexTexture: boolean;
    identityMatrix: any;
    boneMatrices: Float32Array;
    boneTexture: any;
    boneTextureSize: number;
    frame: number;

    calculateInverses(): void;
    pose(): void;
    update(): void;
    getBoneByName(name: string): Bone | undefined;
    getWorldPosition(bone: Bone): Vector3;
    boneToWorld(bone: Bone): Vector3;
    getWorldQuaternion(bone: Bone): Quaternion;
    boneToWorldQuaternion(bone: Bone, target?: Quaternion): Quaternion;
    restPose(): void;
    normalizeWeights(): void;
    getBones(): Bone[];
    getActiveBones(): Bone[];
    copy(source: Skeleton): Skeleton;
}

export interface AnimationClip {
    name: string;
    duration: number;
    tracks: AnimationTrack[];
    uuid: string;
    blendMode: number;

    constructor(name: string, duration?: number, tracks?: AnimationTrack[]);

    resetDuration(): void;
    getTrackTimeRanges(): Array<{ name: string; times: number[] }>;
    optimize(): AnimationClip;
    optimizeTracks(): AnimationClip;
    getDuration(): number;
    getTracksDuration(): number;
    trim(start?: number, end?: number): AnimationClip;
    scaleTime(scale: number): AnimationClip;
    convertToVectorKeyframes(): AnimationClip;
    containsTrack(track: AnimationTrack): boolean;
    findByName(name: string, root?: any): AnimationClip | null;
    createMorphTargetSequence(
        morphTargetDictionary: { [name: string]: number },
        morphTargetInfluences: number[],
        duration: number,
        fps: number,
        noFlip: boolean
    ): number[];
    getAt(index: number): AnimationTrack | undefined;
    setAt(index: number, track: AnimationTrack): void;
    dispatchEvent(event: { type: string; track?: AnimationTrack }): void;
}

export interface AnimationTrack {
    name: string;
    times: number[];
    values: Float32Array;
    duration: number;
    trackType: string;

    getType(): string;
    setInterpolation(interpolation: number): void;
    getInterpolation(): number;
    setDuration(duration: number): void;
    createInterpolant(): any;
    getInterpolationType(): any;
    getValuesSize(): number;
    getTimeSize(): number;
    resizeNextCache(): void;
    getNextCacheSizes(interpolant: any): number[];
    interpolate_(index: number, offsetInSeconds: number, interpolant: any): void;
    getValueSize(): number;
    shift(startOffsetInSeconds: number, endOffsetInSeconds: number): AnimationTrack;
    scale(scaleFactor: number): AnimationTrack;
    trim(startTime: number, endTime: number): AnimationTrack;
    shift_(startOffsetInSeconds: number, endOffsetInSeconds: number): AnimationTrack;
    trim_(startTime: number, endTime: number): AnimationTrack;
    validate(): boolean;
    optimize(): AnimationTrack;
    clone(): AnimationTrack;
    copy(source: AnimationTrack): AnimationTrack;
}

export interface QuaternionKeyframeTrack extends AnimationTrack {
    constructor(name: string, times: number[], values: number[]);
    setInterpolation(interpolation: number): void;
    interpolate_(index: number, offsetInSeconds: number, interpolant: any): void;
    clone(): QuaternionKeyframeTrack;
}

export interface VectorKeyframeTrack extends AnimationTrack {
    constructor(name: string, times: number[], values: number[]);
    clone(): VectorKeyframeTrack;
}

export interface NumberKeyframeTrack extends AnimationTrack {
    constructor(name: string, times: number[], values: number[]);
    clone(): NumberKeyframeTrack;
}

export interface StringKeyframeTrack extends AnimationTrack {
    constructor(name: string, times: number[], values: string[]);
    clone(): StringKeyframeTrack;
}

export interface BooleanKeyframeTrack extends AnimationTrack {
    constructor(name: string, times: number[], values: boolean[]);
    clone(): BooleanKeyframeTrack;
}

export interface ColorKeyframeTrack extends AnimationTrack {
    constructor(name: string, times: number[], values: number[]);
    clone(): ColorKeyframeTrack;
}

export interface SkinnedMesh {
    bindMode: string;
    bindMatrix: any;
    bindMatrixInverse: any;
    skeleton: Skeleton;
    geometry: any;
    material: any;
    onBeforeRender: () => void;
    onAfterRender: () => void;
    bind(skeleton: Skeleton, bindMatrix?: any): void;
    pose(): void;
    normalizeSkinWeights(): void;
    updateMatrixWorld(force?: boolean): void;
    clone(): SkinnedMesh;
    copy(source: SkinnedMesh): SkinnedMesh;
    getSkinnedMesh(): SkinnedMesh;
}

export interface AnimationMixer {
    root: any;
    _actions: any[];
    _actionsByName: { [name: string]: any };
    _nActiveActions: number;
    _time: number;
    _timeScale: number;
    _startTime: number;
    _scale: number;
    _root: any;
    velocity: number;
    accel: number;

    constructor(root: any);

    clampActionWhenFinishedAction(n: any): void;
    uncacheAction(action: any, root?: any): any;
    uncacheClip(clip: any, root?: any): any;
    uncacheRoot(root: any): any;
    stopAllAction(): AnimationMixer;
    get root(): any;
    get actions(): any[];
    get _nActiveClips(): number;
    get time(): number;
    set time(value: number);
    get timeScale(): number;
    set timeScale(value: number);
    set root(root: any);
    clipAction(clip: any, optionalRoot?: any, blendMode?: number): any;
    existingAction(action: any, optionalRoot?: any): any;
    play(action: any): any;
    fadeOut(id: number, duration: number): any;
    stop(action: any): any;
    stopAllRootActions(): any;
    getRoot(): any;
    advanceTime(deltaTime: number): void;
    setTime(timeInSeconds: number): void;
    getClip(name: string): any;
    getMixer(): any;
    getActions(): any;
    _scheduleFadeOut(id: number, duration: number, startNow: boolean): void;
    _setupFadeOutAction(action: any, duration: number, startNow: boolean): void;
    removeAction(action: any): any;
    availableActions: any;
}

export interface AnimationAction {
    _ mixer: AnimationMixer;
    _ track: AnimationTrack;
    _ localRoot: any;
    _interpolatorSettings: any;
    _interpolatorHolder: any;
    _loop: number;
    _nLerpCache: number;
    blending: number;
    blendMode: number;
    play: () => AnimationAction;
    stop: () => AnimationAction;
    reset: () => AnimationAction;
    isRunning: boolean;
    isScheduled: boolean;
    startAt: (time: number) => AnimationAction;
    setLoop: (loop: number, repetitions: number) => AnimationAction;
    setEffectiveWeight: (weight: number) => AnimationAction;
    getEffectiveWeight: () => number;
    fadeIn: (duration: number) => AnimationAction;
    fadeOut: (duration: number) => AnimationAction;
    crossFadeFrom: (fadeOutAction: AnimationAction, duration: number, warp: boolean) => AnimationAction;
    crossFadeTo: (fadeInAction: AnimationAction, duration: number, warp: boolean) => AnimationAction;
    stopFading: () => AnimationAction;
    setEffectiveMixingWeight: (weight: number) => AnimationAction;
    updateMixingRootEvent: () => void;
    setTime: (timeInSeconds: number) => void;
    getClip: () => AnimationClip;
    getMixer: () => AnimationMixer;
    getRoot: () => any;
    _ restoreLocalRoot: (localRoot: any) => void;
   playAction: () => AnimationAction;
    stopAction: () => AnimationAction;
    startAction: (startTime: number, root: any) => AnimationAction;
    endAction: (startTime: number, endTime: number, root: any) => void;
    fadeOutAction: (startTime: number, endTime: number) => void;
    initialize: () => void;
    update: (deltaTime: number) => AnimationAction;
    isPending: () => boolean;
    isRunning: () => boolean;
    isScheduled: () => boolean;
    getTime: () => number;
    getDuration: () => number;
    getDirectionalWeight: () => number;
    getPaused: () => boolean;
    setPaused: (paused: boolean) => AnimationAction;
    enable: (enabled: boolean) => AnimationAction;
    setActive: (enabled: boolean) => void;
    setWeight: (weight: number) => AnimationAction;
    getWeight: () => number;
    setTimeScale: (timeScale: number) => AnimationAction;
    getTimeScale: () => number;
    setEffectiveTimeScale: (timeScale: number) => AnimationAction;
    getEffectiveTimeScale: () => number;
    play(): void;
    stop(): void;
    pause(): void;
    run(): void;
    fadeIn(duration: number): AnimationAction;
    fadeOut(duration: number): AnimationAction;
    crossFadeTo(fadeOutAction: AnimationAction, duration: number, warp: boolean): AnimationAction;
    stopFading(): void;
    setDuration(durationInSeconds: number): AnimationAction;
    syncWith(action: AnimationAction): AnimationAction;
    warp(from: number, to: number, duration: number): AnimationAction;
    stopAllWarps(): void;
    getMixer(): AnimationMixer;
    getRoot(): any;
    reset(): AnimationAction;
    get clip(): AnimationClip;
    localRoot: any;
    time: number;
    timeScale: number;
    weight: number;
    effectiveWeight: number;
    effectiveTimeScale: number;
    loop: number;
    paused: boolean;
    enabled: boolean;
}

export interface KeyframeTrackConstructor {
    new(name: string, times: number[], values: number[]): AnimationTrack;
}

export interface NumberKeyframeTrackConstructor {
    new(name: string, times: number[], values: number[]): NumberKeyframeTrack;
}

export interface VectorKeyframeTrackConstructor {
    new(name: string, times: number[], values: number[]): VectorKeyframeTrack;
}

export interface QuaternionKeyframeTrackConstructor {
    new(name: string, times: number[], values: number[]): QuaternionKeyframeTrack;
}

export interface ColorKeyframeTrackConstructor {
    new(name: string, times: number[], values: number[]): ColorKeyframeTrack;
}

export interface StringKeyframeTrackConstructor {
    new(name: string, times: number[], values: string[]): StringKeyframeTrack;
}

export interface BooleanKeyframeTrackConstructor {
    new(name: string, times: number[], values: boolean[]): BooleanKeyframeTrack;
}

export interface KeyframeTrackNames {
    VectorKeyframeTrack: VectorKeyframeTrackConstructor;
    QuaternionKeyframeTrack: QuaternionKeyframeTrackConstructor;
    NumberKeyframeTrack: NumberKeyframeTrackConstructor;
    ColorKeyframeTrack: ColorKeyframeTrackConstructor;
    StringKeyframeTrack: StringKeyframeTrackConstructor;
    BooleanKeyframeTrack: BooleanKeyframeTrackConstructor;
}

export interface BoneKeyframeTrackConstructor {
    new(name: string, times: number[], values: number[]): VectorKeyframeTrack;
}

export interface BoneKeyframeTrackNames {
    VectorKeyframeTrack: BoneKeyframeTrackConstructor;
    QuaternionKeyframeTrack: QuaternionKeyframeTrackConstructor;
    NumberKeyframeTrack: NumberKeyframeTrackConstructor;
}

export interface SkeletalAnimationSystem {
    AnimationMixer: typeof AnimationMixer;
    AnimationClip: typeof AnimationClip;
    KeyframeTrack: KeyframeTrackNames;
    BoneKeyframeTrack: BoneKeyframeTrackNames;
    SkinnedMesh: typeof SkinnedMesh;
    Skeleton: typeof Skeleton;

    constructor();

    createAnimation(root: any, name: string, clips: AnimationClip[]): any;
    getRoot(node: any): any;
}

export declare class SkeletalAnimation {
    constructor(root: any);

    createAnimation(root: any, name: string, clips: AnimationClip[]): any;
    getRoot(node: any): any;
    getObjectByName(name: string, root?: any): any;
    getObjectByProperty(name: string, value: any, root?: any): any;
    findNode(root: any, name: string): any;
}

export { SkeletalAnimation as default };