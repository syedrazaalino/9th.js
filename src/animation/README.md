# Animation System Documentation

A comprehensive animation system for Ninth.js providing keyframes, interpolation, animation clips, and mixing capabilities.

## Table of Contents

- [Overview](#overview)
- [Core Components](#core-components)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Advanced Usage](#advanced-usage)
- [Performance Tips](#performance-tips)

## Overview

The Animation System is a complete solution for creating smooth, professional animations in 3D applications. It provides:

- **Keyframe-based animation** with support for multiple data types
- **Multiple interpolation types** (linear, cubic, quaternion)
- **Animation blending** with weighted mixing and cross-fading
- **Timeline management** with play, pause, stop, and loop controls
- **Performance optimization** through caching and binary search
- **Serialization support** for saving/loading animations

## Core Components

### 1. AnimationUtils
Utility functions for interpolation, easing, and mathematical operations.

### 2. KeyframeTrack
Base class for managing keyframes with different data types and interpolation methods.

### 3. AnimationClip
Container for multiple keyframe tracks forming a coherent animation sequence.

### 4. AnimationMixer
Manages multiple animation clips with blending, cross-fading, and playback controls.

## Installation

The Animation System is included in the Ninth.js library. Import it using:

```javascript
import {
    AnimationUtils,
    KeyframeTrack,
    AnimationClip,
    AnimationMixer,
    AnimationPresets,
    AnimationHelpers
} from 'ninth.js';
```

## Quick Start

### Basic Animation Example

```javascript
import { Vector3KeyframeTrack, AnimationClip, AnimationMixer } from 'ninth.js';
import { Vector3 } from 'ninth.js/math';

// 1. Create keyframes
const times = [0, 1, 2];
const positions = [
    new Vector3(0, 0, 0),
    new Vector3(10, 10, 0),
    new Vector3(20, 0, 0)
];

// 2. Create keyframe track
const positionTrack = new Vector3KeyframeTrack('position', times, positions);

// 3. Create animation clip
const moveClip = new AnimationClip('move', 2.0, [positionTrack]);

// 4. Create mixer and add clip
const mixer = new AnimationMixer(object3D);
mixer.addClip(moveClip);

// 5. Play animation
mixer.play('move');

// 6. Update in animation loop
function animate(deltaTime) {
    mixer.update(deltaTime);
    renderer.render(scene, camera);
}
```

## API Reference

### AnimationUtils

Static utility class providing interpolation and mathematical functions.

#### Interpolation Methods

```javascript
// Linear interpolation for numbers
AnimationUtils.linear(t, start, end)

// Vector2 interpolation
AnimationUtils.vector2Lerp(t, start, end, result)

// Vector3 interpolation
AnimationUtils.vector3Lerp(t, start, end, result)

// Vector4 interpolation
AnimationUtils.vector4Lerp(t, start, end, result)

// Spherical linear interpolation for quaternions
AnimationUtils.quaternionSlerp(t, start, end, result)

// Cubic Hermite interpolation
AnimationUtils.cubicHermite(t, p0, p1, m0, m1, result)

// Catmull-Rom interpolation
AnimationUtils.catmullRom(t, points, result)
```

#### Easing Functions

```javascript
AnimationUtils.ease(t, easingType)
```

Supported easing types:
- `'linear'`
- `'ease-in'`
- `'ease-out'`
- `'ease-in-out'`
- `'bounce'`
- `'elastic'`

#### Utility Methods

```javascript
// Clamp value
AnimationUtils.clamp(value, min, max)

// Smooth step
AnimationUtils.smoothStep(t)

// Convert degrees to radians
AnimationUtils.degreesToRadians(degrees)

// Convert radians to degrees
AnimationUtils.radiansToDegrees(radians)
```

### KeyframeTrack

Base class for keyframe tracks. Specialized versions available for different data types.

#### Constructor

```javascript
new KeyframeTrack(name, times, values, options)
```

**Parameters:**
- `name` (string): Property name to animate
- `times` (Array): Array of keyframe times
- `values` (Array): Array of keyframe values
- `options` (Object): Configuration options

**Options:**
- `type`: Interpolation type ('linear', 'cubic', 'quaternion', 'step')
- `easing`: Easing function name
- `valueSize`: Number of components per value
- `result`: Reusable result object (for performance)

#### Methods

```javascript
// Get interpolated value at time
getValue(time)

// Add keyframe
addKeyframe(time, value)

// Remove keyframe
removeKeyframe(index)

// Update keyframe value
updateKeyframe(index, value)

// Update keyframe time
updateKeyframeTime(index, time)

// Get duration
getDuration()

// Check if empty
isEmpty()

// Clone track
clone()

// Serialize to JSON
toJSON()

// Create from JSON
static fromJSON(data)
```

#### Specialized Track Classes

```javascript
// For numeric values
new NumberKeyframeTrack(name, times, values, options)

// For Vector2 values
new Vector2KeyframeTrack(name, times, values, options)

// For Vector3 values
new Vector3KeyframeTrack(name, times, values, options)

// For Vector4 values
new Vector4KeyframeTrack(name, times, values, options)

// For Quaternion values
new QuaternionKeyframeTrack(name, times, values, options)
```

### AnimationClip

Container for multiple keyframe tracks forming a coherent animation.

#### Constructor

```javascript
new AnimationClip(name, duration, tracks, options)
```

**Parameters:**
- `name` (string): Clip name
- `duration` (number): Clip duration in seconds
- `tracks` (Array): Array of keyframe tracks
- `options` (Object): Configuration options

**Options:**
- `loop`: Enable/disable looping
- `timeScale`: Playback speed multiplier
- `fadeIn`: Fade in duration
- `fadeOut`: Fade out duration
- `weight`: Animation weight (0-1)
- `blendMode`: Blending mode
- `easing`: Default easing function
- `onStart`, `onEnd`, `onLoop`, `onUpdate`: Callback functions

#### Methods

```javascript
// Add track
addTrack(track)

// Remove track
removeTrack(trackOrName)

// Get track
getTrack(name)

// Get tracks by property
getTracksByProperty(property)

// Evaluate at time
evaluate(time, target)

// Play animation
play(startTime)

// Pause/Resume/Stop
pause()
resume()
stop()

// Update (call in animation loop)
update(deltaTime)

// Set time
setTime(time)

// Get normalized time (0-1)
getNormalizedTime()

// Blend with another clip
blendWith(other, alpha)

// Clone clip
clone()

// Serialize to JSON
toJSON()

// Create from data
static fromData(data)

// Create simple clip
static createSimple(name, properties, duration, options)
```

### AnimationMixer

Manages multiple animation clips with blending and playback controls.

#### Constructor

```javascript
new AnimationMixer(root, options)
```

**Parameters:**
- `root` (Object): Root object to animate
- `options` (Object): Configuration options

**Options:**
- `timeScale`: Global time scale
- `loop`: Default loop setting
- `blendMode`: Default blend mode
- `enabled`: Enable/disable mixer

#### Methods

```javascript
// Add clip
addClip(clip, options)

// Remove clip
removeClip(clipOrName)

// Get action
getAction(name)

// Play/Stop clips
play(name, fadeInDuration)
stop(name, fadeOutDuration)

// Cross fade between clips
crossFade(fromName, toName, duration, playTo)
crossFadeTo(toName, duration)

// Fade in/out specific clips
fadeIn(name, duration)
fadeOut(name, duration)

// Set/get weight
setWeight(name, weight)
getWeight(name)

// Update mixer
update(deltaTime)

// Control all animations
stopAll()
pauseAll()
resumeAll()

// Get playing actions
getPlayingActions()

// Set time scale
setTimeScale(timeScale)

// Get/set time
getTime()
setTime(time)

// Clone mixer
clone()
```

### AnimationAction

Represents a single animation clip within a mixer.

#### Methods

```javascript
// Playback control
play()
pause()
resume()
stop()

// Update action
update(deltaTime)

// Fade controls
fadeIn(duration)
fadeOut(duration)

// Property setters/getters
setWeight(weight)
getWeight()
setTimeScale(timeScale)
getTimeScale()
setTime(time)

// State queries
isPlaying()

// Evaluate at current time
evaluate()
```

## Examples

### 1. Basic Movement Animation

```javascript
import { Vector3KeyframeTrack, AnimationClip, AnimationMixer } from 'ninth.js';
import { Vector3 } from 'ninth.js/math';

const times = [0, 1, 2, 3];
const positions = [
    new Vector3(0, 0, 0),
    new Vector3(5, 0, 0),
    new Vector3(5, 5, 0),
    new Vector3(10, 5, 0)
];

const track = new Vector3KeyframeTrack('position', times, positions);
const clip = new AnimationClip('move', 3.0, [track]);

const mixer = new AnimationMixer(cube);
mixer.addClip(clip);
mixer.play('move');
```

### 2. Rotation Animation

```javascript
import { QuaternionKeyframeTrack } from 'ninth.js';
import { Quaternion, Vector3 } from 'ninth.js/math';

const times = [0, 2];
const rotations = [
    new Quaternion(),
    new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI * 2)
];

const track = new QuaternionKeyframeTrack('rotation', times, rotations);
const clip = new AnimationClip('rotate', 2.0, [track]);
```

### 3. Animation Blending

```javascript
// Create two clips
const walkClip = new AnimationClip('walk', 1.0, [...]);
const runClip = new AnimationClip('run', 1.0, [...]);

const mixer = new AnimationMixer(character);

// Add both clips
mixer.addClip(walkClip, { name: 'walk', weight: 1.0 });
mixer.addClip(runClip, { name: 'run', weight: 0.0 });

// Play walking
mixer.play('walk');

// Gradually blend to running
let blendProgress = 0;
function blendToRun(deltaTime) {
    blendProgress += deltaTime * 0.5; // Blend over 2 seconds
    const walkWeight = 1 - blendProgress;
    const runWeight = blendProgress;
    
    mixer.setWeight('walk', walkWeight);
    mixer.setWeight('run', runWeight);
    
    if (blendProgress >= 1) {
        mixer.play('run');
        mixer.fadeOut('walk', 0.5);
    }
}
```

### 4. Cross Fading

```javascript
// Cross fade between idle and walk animations
mixer.crossFade('idle', 'walk', 0.3);

// Cross fade to specific animation
mixer.crossFadeTo('jump', 0.5);
```

### 5. Using Animation Presets

```javascript
import { AnimationPresets, AnimationHelpers } from 'ninth.js';

// Create position animation
const moveAnim = AnimationPresets.position('move', [
    { time: 0, position: new Vector3(0, 0, 0) },
    { time: 1, position: new Vector3(10, 0, 0) },
    { time: 2, position: new Vector3(10, 5, 0) }
]);

// Create bounce animation
const bounceAnim = AnimationHelpers.bounce(
    'bounce',
    new Vector3(0, 0, 0),
    new Vector3(0, 10, 0),
    2.0,
    3 // number of bounces
);

// Create fade animation
const fadeAnim = AnimationHelpers.fade('fade', 0, 1, 1.0);
```

### 6. Complex Multi-Property Animation

```javascript
// Create clip with multiple properties
const complexClip = new AnimationClip('complex', 4.0, [
    new Vector3KeyframeTrack('position', [0, 4], [startPos, endPos]),
    new NumberKeyframeTrack('scale', [0, 4], [1, 2]),
    new NumberKeyframeTrack('opacity', [1, 3], [0, 1])
]);

// Mix with other animations
const mixer = new AnimationMixer(object);
mixer.addClip(complexClip);
mixer.addClip(otherClip);

// Evaluate all properties at once
const values = complexClip.evaluate(2.5);
console.log(values.position); // Vector3
console.log(values.scale);    // number
console.log(values.opacity);  // number
```

### 7. Animation Serialization

```javascript
// Serialize to JSON
const json = clip.toJSON();

// Save to file or send to server
localStorage.setItem('animation', JSON.stringify(json));

// Load from JSON
const loadedClip = AnimationClip.fromData(JSON.parse(json));

// Create mixer from serialized clips
const loadedMixer = new AnimationMixer(object);
for (const clipData of json.clips) {
    const clip = AnimationClip.fromData(clipData);
    loadedMixer.addClip(clip);
}
```

## Advanced Usage

### Custom Interpolation

```javascript
class CustomKeyframeTrack extends KeyframeTrack {
    _interpolate(time) {
        // Custom interpolation logic
        const index = this._findIndex(time);
        const t0 = this.times[index];
        const t1 = this.times[index + 1];
        const localTime = (time - t0) / (t1 - t0);
        
        // Apply custom interpolation
        const v0 = this.values[index];
        const v1 = this.values[index + 1];
        
        return this.customInterpolate(localTime, v0, v1);
    }
    
    customInterpolate(t, v0, v1) {
        // Your interpolation logic
        return v0 + (v1 - v0) * Math.sin(t * Math.PI / 2);
    }
}
```

### Animation Events and Callbacks

```javascript
const clip = new AnimationClip('test', 2.0, [track], {
    onStart: (clip) => console.log('Animation started:', clip.name),
    onEnd: (clip) => console.log('Animation ended:', clip.name),
    onLoop: (clip) => console.log('Animation looped:', clip.name),
    onUpdate: (clip, time) => console.log('Update:', time)
});

const action = mixer.addClip(clip);
action.onUpdate = (action, deltaTime) => {
    // Custom action update logic
};
```

### Performance Optimization

```javascript
// Reuse result objects for better performance
const result = new Vector3();
const track = new Vector3KeyframeTrack('position', times, values, { result });

// Enable caching for frequently accessed tracks
track.cacheEnabled = true;

// Use binary search optimization
// (automatically enabled for tracks with > 10 keyframes)
```

## Performance Tips

1. **Use Result Objects**: Pass a result object to interpolation methods to avoid memory allocation.

2. **Cache Keyframes**: Enable caching for tracks accessed frequently.

3. **Use Binary Search**: Automatic for tracks with many keyframes.

4. **Batch Updates**: Update mixer once per frame, not per animation.

5. **Weight Optimization**: Use weights efficiently - animations with zero weight are skipped.

6. **Looping**: Enable looping for repetitive animations instead of restarting.

7. **Fade Optimization**: Use fades sparingly as they require per-frame weight calculations.

8. **Memory Management**: Dispose unused clips and tracks to free memory.

```javascript
// Good: Reuse result objects
const result = new Vector3();
const track = new Vector3KeyframeTrack('position', times, values, { result });

// Good: Batch mixer updates
function animate() {
    const deltaTime = clock.getDelta();
    mixer.update(deltaTime); // Single update
    renderer.render(scene, camera);
}

// Avoid: Multiple updates per frame
// mixer.update(0.016);
// mixer.update(0.016); // Don't do this
```

## Interpolation Types

### Linear Interpolation
```javascript
// Standard linear interpolation between keyframes
// Good for: Position, scale, simple numeric values
const track = new Vector3KeyframeTrack('position', times, values, {
    type: 'linear'
});
```

### Cubic Interpolation
```javascript
// Smooth cubic interpolation with tangents
// Good for: Organic motion, camera paths, complex trajectories
const track = new Vector3KeyframeTrack('position', times, values, {
    type: 'cubic'
});
```

### Quaternion Interpolation
```javascript
// Spherical linear interpolation for rotations
// Good for: Rotation animations, avoiding gimbal lock
const track = new QuaternionKeyframeTrack('rotation', times, values, {
    type: 'quaternion'
});
```

### Step Interpolation
```javascript
// Discrete value changes (no interpolation)
// Good for:开关 animations, state changes
const track = new NumberKeyframeTrack('visibility', times, values, {
    type: 'step'
});
```

## Blend Modes

- **'normal'**: Standard weighted blending
- **'add'**: Additive blending (use for effects)
- **'subtract'**: Subtractive blending
- **'multiply'**: Multiply blending
- **'screen'**: Screen blending
- **'overlay'**: Overlay blending

## Version History

- **v1.0.0**: Initial release with core animation features

## License

Part of Ninth.js - see main library license.
