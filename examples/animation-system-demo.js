/**
 * AnimationSystem Example
 * Demonstrates keyframes, interpolation, animation clips, and mixing
 */

import {
    AnimationUtils,
    AnimationClip,
    AnimationMixer,
    KeyframeTrack,
    NumberKeyframeTrack,
    Vector3KeyframeTrack,
    QuaternionKeyframeTrack,
    AnimationPresets,
    AnimationHelpers
} from '../src/animation/index.js';

import { Vector3 } from '../src/core/math/Vector3.js';
import { Quaternion } from '../src/core/math/Quaternion.js';

// Create a demo object
class DemoObject {
    constructor() {
        this.position = new Vector3(0, 0, 0);
        this.rotation = new Quaternion();
        this.scale = new Vector3(1, 1, 1);
        this.opacity = 1.0;
        this.color = { r: 1, g: 1, b: 1 };
    }
}

console.log('=== Animation System Demo ===\n');

// 1. Demonstrate AnimationUtils
console.log('1. Animation Utils Demo:');
console.log('Linear interpolation:', AnimationUtils.linear(0.5, 0, 10)); // 5
console.log('Cubic easing:', AnimationUtils.ease(0.5, 'ease-in-out')); // ~0.5
console.log('Vector3 lerp:', AnimationUtils.vector3Lerp(0.5, new Vector3(0, 0, 0), new Vector3(10, 10, 10)));
console.log('Quaternion slerp:', AnimationUtils.quaternionSlerp(0.5, new Quaternion(), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)));
console.log('');

// 2. Demonstrate KeyframeTracks
console.log('2. Keyframe Track Demo:');

// Number track
const numberTrack = new NumberKeyframeTrack('opacity', [0, 1, 2], [0, 0.5, 1]);
console.log('Number keyframes:', numberTrack.getValue(0.5)); // 0.5

// Vector3 track
const positionTrack = new Vector3KeyframeTrack('position', 
    [0, 1, 2], 
    [
        new Vector3(0, 0, 0),
        new Vector3(10, 10, 0),
        new Vector3(20, 0, 0)
    ]
);
console.log('Position at t=0.5:', positionTrack.getValue(0.5));

// Quaternion track
const rotationTrack = new QuaternionKeyframeTrack('rotation',
    [0, 2],
    [
        new Quaternion(),
        new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI)
    ]
);
console.log('Rotation at t=1:', rotationTrack.getValue(1));
console.log('');

// 3. Demonstrate AnimationClips
console.log('3. Animation Clip Demo:');

// Create a movement animation clip
const moveClip = new AnimationClip('move', 3.0, [
    new Vector3KeyframeTrack('position', [0, 3], [new Vector3(0, 0, 0), new Vector3(10, 0, 0)])
]);

// Create a rotation animation clip
const rotateClip = new AnimationClip('rotate', 2.0, [
    new QuaternionKeyframeTrack('rotation', [0, 2], [
        new Quaternion(),
        new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI * 2)
    ])
]);

console.log('Move clip duration:', moveClip.getDuration());
console.log('Rotate clip duration:', rotateClip.getDuration());

// Evaluate at specific time
const moveValues = moveClip.evaluate(1.5);
console.log('Move values at t=1.5:', moveValues);
console.log('');

// 4. Demonstrate AnimationMixer
console.log('4. Animation Mixer Demo:');

const demoObject = new DemoObject();
const mixer = new AnimationMixer(demoObject);

// Add clips to mixer
mixer.addClip(moveClip, { name: 'move', weight: 1.0 });
mixer.addClip(rotateClip, { name: 'rotate', weight: 0.5 });

// Play animations
mixer.play('move');
mixer.play('rotate');

// Simulate time progression
for (let i = 0; i <= 10; i++) {
    const deltaTime = 0.1;
    mixer.update(deltaTime);
    
    if (i % 5 === 0) {
        console.log(`Time ${i * 0.1}s:`);
        console.log('  Position:', demoObject.position);
        console.log('  Rotation:', demoObject.rotation);
    }
}
console.log('');

// 5. Demonstrate AnimationPresets
console.log('5. Animation Presets Demo:');

// Position animation preset
const positionAnim = AnimationPresets.position('movePreset', [
    { time: 0, position: new Vector3(0, 0, 0) },
    { time: 1, position: new Vector3(5, 5, 0) },
    { time: 2, position: new Vector3(10, 0, 0) }
]);
console.log('Position animation created:', positionAnim.name);

// Bounce animation preset
const bounceAnim = AnimationHelpers.bounce(
    'bounce',
    new Vector3(0, 0, 0),
    new Vector3(0, 10, 0),
    2.0,
    3
);
console.log('Bounce animation created:', bounceAnim.name);
console.log('');

// 6. Demonstrate Animation Blending
console.log('6. Animation Blending Demo:');

// Create a cross fade
const fadeInClip = AnimationClip.createSimple('fadeIn', {
    opacity: [
        { time: 0, value: 0 },
        { time: 1, value: 1 }
    ]
}, 1.0);

const fadeOutClip = AnimationClip.createSimple('fadeOut', {
    opacity: [
        { time: 0, value: 1 },
        { time: 1, value: 0 }
    ]
}, 1.0);

const fadeMixer = new AnimationMixer(demoObject);
fadeMixer.addClip(fadeInClip, { name: 'fadeIn' });
fadeMixer.addClip(fadeOutClip, { name: 'fadeOut' });

// Start with fadeOut, then cross fade to fadeIn
fadeMixer.play('fadeOut');
setTimeout(() => {
    fadeMixer.crossFade('fadeOut', 'fadeIn', 0.5);
    console.log('Cross fade started');
}, 500);

// Simulate blend for demonstration
demoObject.opacity = 1; // Start fully opaque
setTimeout(() => {
    console.log('Cross fade in progress...');
    // Simulate the cross fade
    for (let t = 0; t <= 0.5; t += 0.1) {
        const fadeOutWeight = 1 - (t / 0.5);
        const fadeInWeight = t / 0.5;
        const blendedOpacity = fadeOutWeight * 0 + fadeInWeight * 1;
        console.log(`  Blended opacity at ${t.toFixed(1)}s: ${blendedOpacity.toFixed(2)}`);
    }
}, 600);

console.log('');

// 7. Demonstrate Complex Animations
console.log('7. Complex Animation Demo:');

// Create a complex clip with multiple properties
const complexClip = new AnimationClip('complex', 4.0, [
    new Vector3KeyframeTrack('position', [0, 2, 4], [
        new Vector3(0, 0, 0),
        new Vector3(10, 5, 0),
        new Vector3(20, 0, 0)
    ]),
    new NumberKeyframeTrack('scale', [0, 4], [1, 2]),
    new NumberKeyframeTrack('opacity', [1, 3], [0, 1])
]);

const complexObject = new DemoObject();
const complexMixer = new AnimationMixer(complexObject);
complexMixer.addClip(complexClip);

console.log('Complex animation with position, scale, and opacity tracks');
console.log('Tracks:', complexClip.getTrackNames());

// Evaluate complex animation
const complexValues = complexClip.evaluate(2.5);
console.log('Values at t=2.5:', complexValues);
console.log('');

// 8. Animation Serialization
console.log('8. Animation Serialization Demo:');

// Serialize animation clip
const serialized = complexClip.toJSON();
console.log('Serialized clip JSON (partial):');
console.log('  Name:', serialized.name);
console.log('  Duration:', serialized.duration);
console.log('  Number of tracks:', serialized.tracks.length);

// Deserialize animation clip
const deserializedClip = AnimationClip.fromData(serialized);
console.log('Deserialized clip name:', deserializedClip.name);
console.log('Deserialized clip duration:', deserializedClip.getDuration());
console.log('');

// 9. Performance and Optimization
console.log('9. Performance Features:');
console.log('- KeyframeTrack cache optimization for repeated calls');
console.log('- Binary search for efficient keyframe lookup');
console.log('- Automatic time normalization and looping');
console.log('- Weight-based blending with fade controls');
console.log('- Lazy evaluation of animation values');
console.log('');

console.log('=== Demo Complete ===');
console.log('\nKey Features Demonstrated:');
console.log('✓ Linear, cubic, and quaternion interpolation');
console.log('✓ Keyframe track management');
console.log('✓ Animation clips with multiple tracks');
console.log('✓ Animation mixer with blending');
console.log('✓ Cross-fading between animations');
console.log('✓ Animation presets and helpers');
console.log('✓ Timeline and playback controls');
console.log('✓ Serialization and deserialization');

// Export for external use
export {
    DemoObject,
    AnimationUtils,
    AnimationClip,
    AnimationMixer,
    AnimationPresets,
    AnimationHelpers
};
