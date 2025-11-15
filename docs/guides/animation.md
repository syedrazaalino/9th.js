# Animation Guide

Animation is a core feature of 9th.js, enabling you to bring 3D scenes to life. This guide covers the animation system, from basic keyframe animations to complex character animation with skeletal systems.

## Animation System Overview

The 9th.js animation system consists of:

- **AnimationClips** - Containers for animation data
- **AnimationMixers** - Controllers that play clips on objects
- **KeyframeTracks** - Define how properties change over time
- **AnimationActions** - Individual playback instances

## Basic Animation

### Simple Keyframe Animation

```typescript
import { VectorKeyframeTrack, AnimationClip, AnimationMixer } from '9th.js';

// Create a box mesh
const box = new Mesh(new BoxGeometry(1, 1, 1), new StandardMaterial({ color: 0x00ff00 }));
scene.add(box);

// Create position keyframes
const positionTrack = new VectorKeyframeTrack(
  '.position',                    // Target property
  [0, 1, 2],                     // Time points (seconds)
  [
    0, 0, 0,                     // Start position
    0, 2, 0,                     // Mid position (up)
    0, 0, 0                      // End position (back to start)
  ]
);

// Create rotation keyframes
const rotationTrack = new VectorKeyframeTrack(
  '.rotation',
  [0, 2],
  [
    0, 0, 0,                     // Start rotation
    0, Math.PI * 2, 0            // Full rotation
  ]
);

// Combine tracks into a clip
const clip = new AnimationClip('bounce', 2, [positionTrack, rotationTrack]);

// Create mixer and action
const mixer = new AnimationMixer(box);
const action = mixer.clipAction(clip);

// Configure playback
action.setLoop(LoopRepeat, Infinity);
action.setDuration(2); // Loop every 2 seconds

// Start animation
action.play();

// Update mixer in animation loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer.update(delta);
  renderer.render(scene, camera);
}
```

### Multiple Property Animation

```typescript
// Animate multiple properties simultaneously
const scaleTrack = new VectorKeyframeTrack(
  '.scale',
  [0, 0.5, 1],
  [
    1, 1, 1,                     // Normal size
    2, 2, 2,                     // Double size
    1, 1, 1                      // Back to normal
  ]
);

const colorTrack = new ColorKeyframeTrack(
  '.material.color',
  [0, 1],
  [
    1, 0, 0,                     // Red
    0, 0, 1                      // Blue
  ]
);

// Create clip with multiple tracks
const multiClip = new AnimationClip('scaleAndColor', 1, [
  positionTrack,
  scaleTrack,
  colorTrack
]);

const action = mixer.clipAction(multiClip);
action.play();
```

## Animation Track Types

### NumberTrack

```typescript
// Animate numeric properties
const numberTrack = new NumberKeyframeTrack(
  '.material.opacity',
  [0, 1, 2],
  [1, 0, 1]  // Fade out and back in
);
```

### BooleanTrack

```typescript
// Animate boolean properties
const booleanTrack = new BooleanKeyframeTrack(
  '.visible',
  [0, 1, 2],
  [true, false, true]  // Blink effect
);
```

### StringTrack

```typescript
// Animate string properties
const stringTrack = new StringKeyframeTrack(
  '.material.name',
  [0, 1, 2],
  ['idle', 'walking', 'running']
);
```

### QuaternionTrack

```typescript
// Animate rotations using quaternions (avoids gimbal lock)
const quaternionTrack = new QuaternionKeyframeTrack(
  '.quaternion',
  [0, 0.5, 1],
  [
    0, 0, 0, 1,  // No rotation
    0, 0, 0.707, 0.707,  // 90 degree rotation
    0, 0, 0, 1   // Full rotation
  ]
);
```

## Advanced Animation Techniques

### Animation Mixing

```typescript
// Mix multiple animations
const walkAction = mixer.clipAction(walkClip);
const runAction = mixer.clipAction(runClip);

// Configure for blending
walkAction.enabled = true;
runAction.enabled = true;

walkAction.setEffectiveWeight(0.8);
runAction.setEffectiveWeight(0.2);

// Play both animations simultaneously
walkAction.play();
runAction.play();

// Blend between animations based on speed
function updateAnimation(speed: number) {
  walkAction.setEffectiveWeight(1 - speed);
  runAction.setEffectiveWeight(speed);
  
  if (speed > 0.7 && !runAction.isRunning()) {
    walkAction.crossFadeTo(runAction, 0.3, false);
  } else if (speed < 0.3 && !walkAction.isRunning()) {
    runAction.crossFadeTo(walkAction, 0.3, false);
  }
}
```

### Animation Events

```typescript
// Listen for animation events
action.on('finished', () => {
  console.log('Animation finished!');
});

action.on('loop', (e) => {
  console.log(`Animation looped ${e.localState} times`);
});

// Custom events
action.on('midpoint', () => {
  console.log('Animation reached midpoint');
  // Trigger special effects
  createSparkleEffect();
});

// Set up custom event triggers
class EventTrack extends KeyframeTrack {
  constructor(name: string, times: number[], events: string[]) {
    super(name, times, events);
  }
  
  setValueAtTime(value: string, time: number): void {
    super.setValueAtTime(value, time);
    
    // Trigger event when this value is reached
    if (value === 'trigger') {
      this.onEvent(time);
    }
  }
  
  private onEvent(time: number): void {
    // Emit custom event
    this.emit('animationEvent', { time, type: 'trigger' });
  }
}
```

### Procedural Animation

```typescript
// Animation driven by code rather than keyframes
class ProceduralAnimator {
  private objects: Map<string, ProceduralAnimation> = new Map();
  
  addFloatingObject(object: Object3D, amplitude: number = 1, speed: number = 1): void {
    const animation: ProceduralAnimation = {
      object,
      update: (time: number) => {
        object.position.y = Math.sin(time * speed) * amplitude;
        object.rotation.y = time * speed * 0.5;
      }
    };
    
    this.objects.set(object.uuid, animation);
  }
  
  addWavingObject(object: Object3D, frequency: number = 2): void {
    const animation: ProceduralAnimation = {
      object,
      update: (time: number) => {
        object.rotation.z = Math.sin(time * frequency) * 0.3;
        object.scale.x = 1 + Math.sin(time * frequency) * 0.1;
      }
    };
    
    this.objects.set(object.uuid, animation);
  }
  
  updateAll(time: number): void {
    this.objects.forEach(animation => {
      animation.update(time);
    });
  }
  
  removeObject(object: Object3D): void {
    this.objects.delete(object.uuid);
  }
}

// Usage
const proceduralAnimator = new ProceduralAnimator();
proceduralAnimator.addFloatingObject(cube, 2, 0.5);
proceduralAnimator.addWavingObject(flag, 1.5);

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  
  proceduralAnimator.updateAll(time);
  renderer.render(scene, camera);
}
```

## Skeletal Animation

### Basic Skeletal Animation

```typescript
import { SkinnedMesh, Skeleton, Bone } from '9th.js';

// Create skinned mesh with skeleton
const skinnedMesh = new SkinnedMesh(geometry, material);

// Create bones
const spine = new Bone();
spine.position.y = 1;

const head = new Bone();
head.position.y = 1;

const leftArm = new Bone();
leftArm.position.set(-1, 1, 0);

const rightArm = new Bone();
rightArm.position.set(1, 1, 0);

// Build hierarchy
skinnedMesh.add(spine);
spine.add(head);
spine.add(leftArm);
spine.add(rightArm);

// Create skeleton
const skeleton = new Skeleton([spine, head, leftArm, rightArm]);
skinnedMesh.bind(skeleton);

// Create animation tracks for bones
const headTrack = new VectorKeyframeTrack(
  '.bones[Head].position',
  [0, 1, 2],
  [
    0, 1, 0,  // Base position
    0.2, 1.1, 0,  // Nod down
    0, 1, 0   // Back to base
  ]
);

// Add to animation clip
const headAnimation = new AnimationClip('headNod', 2, [headTrack]);
const action = mixer.clipAction(headAnimation);
action.play();
```

### Bone Weight Painting

```typescript
// Manually assign vertex weights to bones
function assignVertexWeights(
  skinnedMesh: SkinnedMesh,
  boneIndex: number,
  vertexIndices: number[],
  weight: number
): void {
  const geometry = skinnedMesh.geometry;
  const skinIndex = geometry.getAttribute('skinIndex');
  const skinWeight = geometry.getAttribute('skinWeight');
  
  vertexIndices.forEach(vertexIndex => {
    // Find available weight slot (max 4 bones per vertex)
    for (let i = 0; i < 4; i++) {
      const currentWeight = skinWeight.getX(vertexIndex);
      
      if (currentWeight === 0) {
        // Set bone index and weight
        skinIndex.setX(vertexIndex, boneIndex);
        skinWeight.setX(vertexIndex, weight);
        break;
      }
    }
  });
  
  skinIndex.needsUpdate = true;
  skinWeight.needsUpdate = true;
}

// Example: Weight vertices to arm bone
const armVertices = [100, 101, 102, 103, 104]; // Vertex indices near arm
assignVertexWeights(skinnedMesh, 2, armVertices, 1.0); // Bone index 2 = right arm
```

### Bone Constraints

```typescript
// Implement bone constraints for realistic movement
class BoneConstraint {
  static limitRotation(bone: Bone, min: Euler, max: Euler): void {
    bone.onBeforeRender = () => {
      bone.rotation.x = Math.max(min.x, Math.min(max.x, bone.rotation.x));
      bone.rotation.y = Math.max(min.y, Math.min(max.y, bone.rotation.y));
      bone.rotation.z = Math.max(min.z, Math.min(max.z, bone.rotation.z));
    };
  }
  
  static limitPosition(bone: Bone, min: Vector3, max: Vector3): void {
    bone.onBeforeRender = () => {
      bone.position.x = Math.max(min.x, Math.min(max.x, bone.position.x));
      bone.position.y = Math.max(min.y, Math.min(max.y, bone.position.y));
      bone.position.z = Math.max(min.z, Math.min(max.z, bone.position.z));
    };
  }
}

// Apply constraints to prevent unrealistic movement
const arm = skinnedMesh.skeleton.bones[2]; // Right arm bone

BoneConstraint.limitRotation(arm, 
  new Euler(-Math.PI/2, -Math.PI/4, -Math.PI/4),
  new Euler(Math.PI/2, Math.PI/4, Math.PI/4)
);
```

## Animation State Machines

### Basic State Machine

```typescript
// Animation state machine for character control
class AnimationStateMachine {
  private states: Map<string, AnimationState> = new Map();
  private currentState: AnimationState | null = null;
  private mixer: AnimationMixer;
  
  constructor(mixer: AnimationMixer) {
    this.mixer = mixer;
  }
  
  addState(name: string, state: AnimationState): void {
    this.states.set(name, state);
  }
  
  changeState(name: string, data?: any): void {
    const newState = this.states.get(name);
    if (!newState) return;
    
    // Exit current state
    if (this.currentState && this.currentState.exit) {
      this.currentState.exit();
    }
    
    // Enter new state
    this.currentState = newState;
    if (this.currentState.enter) {
      this.currentState.enter(data);
    }
  }
  
  update(deltaTime: number): void {
    if (this.currentState && this.currentState.update) {
      this.currentState.update(deltaTime);
    }
  }
  
  getCurrentState(): string | null {
    return this.currentState ? this.currentState.name : null;
  }
}

interface AnimationState {
  name: string;
  enter?: (data?: any) => void;
  update?: (deltaTime: number) => void;
  exit?: () => void;
}

// Define character states
const states: AnimationState[] = [
  {
    name: 'idle',
    enter: () => {
      const action = mixer.clipAction(idleClip);
      action.crossFadeFrom(currentAction, 0.3, false);
      action.play();
    },
    update: (deltaTime) => {
      // Idle logic - look around, breathe
      if (inputDetector.isMoving()) {
        changeState('walk');
      }
    }
  },
  {
    name: 'walk',
    enter: () => {
      const action = mixer.clipAction(walkClip);
      action.crossFadeFrom(currentAction, 0.2, false);
      action.play();
    },
    update: (deltaTime) => {
      // Walk logic
      if (inputDetector.isRunning()) {
        changeState('run');
      } else if (!inputDetector.isMoving()) {
        changeState('idle');
      }
    }
  },
  {
    name: 'run',
    enter: () => {
      const action = mixer.clipAction(runClip);
      action.crossFadeFrom(currentAction, 0.2, false);
      action.play();
    },
    update: (deltaTime) => {
      // Run logic
      if (!inputDetector.isRunning()) {
        changeState('walk');
      }
    }
  }
];

// Setup state machine
const stateMachine = new AnimationStateMachine(mixer);
states.forEach(state => stateMachine.addState(state.name, state));
stateMachine.changeState('idle');
```

### Complex State Transitions

```typescript
// Advanced state machine with transitions
class AdvancedStateMachine {
  private transitions: Map<string, Transition[]> = new Map();
  private currentState: string;
  private transitionTime: number = 0;
  private isTransitioning: boolean = false;
  
  constructor(initialState: string) {
    this.currentState = initialState;
  }
  
  addTransitions(fromState: string, transitions: Transition[]): void {
    this.transitions.set(fromState, transitions);
  }
  
  update(deltaTime: number): void {
    if (this.isTransitioning) {
      this.transitionTime += deltaTime;
      this.updateTransition();
      return;
    }
    
    // Check for state transitions
    const transitions = this.transitions.get(this.currentState);
    if (transitions) {
      for (const transition of transitions) {
        if (transition.condition()) {
          this.startTransition(transition);
          break;
        }
      }
    }
  }
  
  private startTransition(transition: Transition): void {
    this.isTransitioning = true;
    this.transitionTime = 0;
    
    // Cross fade animations
    mixer.crossFadeClip(transition.fromClip, transition.toClip, transition.duration);
  }
  
  private updateTransition(): void {
    const transitions = this.transitions.get(this.currentState);
    const transition = transitions?.find(t => t.toClip);
    
    if (transition && this.transitionTime >= transition.duration) {
      this.isTransitioning = false;
      this.transitionTime = 0;
      this.currentState = transition.toState;
    }
  }
}

// Define transitions with conditions
const transitions: Transition[] = [
  {
    fromState: 'idle',
    toState: 'walk',
    condition: () => inputDetector.isMoving(),
    fromClip: idleClip,
    toClip: walkClip,
    duration: 0.3
  },
  {
    fromState: 'walk',
    toState: 'run',
    condition: () => inputDetector.isRunning(),
    fromClip: walkClip,
    toClip: runClip,
    duration: 0.2
  },
  {
    fromState: 'any',
    toState: 'idle',
    condition: () => !inputDetector.isMoving() && this.currentState !== 'idle',
    fromClip: null,
    toClip: idleClip,
    duration: 0.3
  }
];
```

## Animation Utilities

### Animation Blending

```typescript
// Blend between multiple animations
class AnimationBlender {
  private actions: Map<string, { action: AnimationAction, weight: number }> = new Map();
  
  addAction(name: string, action: AnimationAction): void {
    this.actions.set(name, { action, weight: 0 });
    action.play();
  }
  
  setWeight(name: string, weight: number): void {
    const actionData = this.actions.get(name);
    if (actionData) {
      actionData.weight = Math.max(0, Math.min(1, weight));
      actionData.action.setEffectiveWeight(actionData.weight);
    }
  }
  
  blendTo(name: string, weight: number, duration: number): void {
    const startWeight = this.actions.get(name)?.weight || 0;
    const startTime = performance.now();
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth interpolation
      const currentWeight = startWeight + (weight - startWeight) * this.easeInOut(progress);
      this.setWeight(name, currentWeight);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  private easeInOut(t: number): number {
    return t * t * (3 - 2 * t);
  }
}

// Usage
const blender = new AnimationBlender();
blender.addAction('idle', mixer.clipAction(idleClip));
blender.addAction('walk', mixer.clipAction(walkClip));
blender.addAction('run', mixer.clipAction(runClip));

// Smoothly blend based on movement speed
function updateMovement(speed: number) {
  if (speed < 0.3) {
    blender.blendTo('idle', speed / 0.3, 0.2);
    blender.setWeight('walk', 0);
    blender.setWeight('run', 0);
  } else if (speed < 0.8) {
    blender.setWeight('idle', 0);
    blender.blendTo('walk', 1, 0.2);
    blender.setWeight('run', 0);
  } else {
    blender.setWeight('idle', 0);
    blender.setWeight('walk', 0);
    blender.blendTo('run', 1, 0.2);
  }
}
```

### Animation Timeline

```typescript
// Timeline-based animation system
class AnimationTimeline {
  private tracks: Map<string, KeyframeTrack> = new Map();
  private duration: number = 0;
  private currentTime: number = 0;
  private isPlaying: boolean = false;
  
  addTrack(name: string, track: KeyframeTrack): void {
    this.tracks.set(name, track);
    this.duration = Math.max(this.duration, track.times[track.times.length - 1]);
  }
  
  play(): void {
    this.isPlaying = true;
    this.currentTime = 0;
  }
  
  pause(): void {
    this.isPlaying = false;
  }
  
  seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(this.duration, time));
    this.updateTracks();
  }
  
  setTime(time: number): void {
    this.currentTime = time;
    this.updateTracks();
  }
  
  private updateTracks(): void {
    this.tracks.forEach((track, name) => {
      // Apply track values at current time
      track.setValueAtTime(this.currentTime, name);
    });
  }
  
  update(deltaTime: number): void {
    if (this.isPlaying) {
      this.currentTime += deltaTime;
      if (this.currentTime >= this.duration) {
        this.currentTime = 0; // Loop
      }
      this.updateTracks();
    }
  }
  
  getDuration(): number {
    return this.duration;
  }
  
  getCurrentTime(): number {
    return this.currentTime;
  }
}
```

This completes the animation guide. The animation system in 9th.js provides powerful tools for creating everything from simple keyframe animations to complex character animation systems. Experiment with different track types and blending techniques to achieve the desired visual effects in your applications.