# Comprehensive API Reference

This document provides a complete reference to all classes, methods, properties, and functions in the Ninth.js WebGL 3D library.

## Table of Contents

- [Core Classes](#core-classes)
- [Geometry Classes](#geometry-classes)
- [Material Classes](#material-classes)
- [Camera Classes](#camera-classes)
- [Light Classes](#light-classes)
- [Animation Classes](#animation-classes)
- [Loader Classes](#loader-classes)
- [Particle System Classes](#particle-system-classes)
- [Physics Classes](#physics-classes)
- [Control Classes](#control-classes)
- [Texture Classes](#texture-classes)
- [Utility Classes](#utility-classes)
- [Event System](#event-system)

---

## Core Classes

### Scene
**Description:** Container for all 3D objects and scene management. The Scene class manages the scene graph, rendering pipeline, and object lifecycle.

**Constructor:** `new Scene()`

**Properties:**
- `root: Object3D` - Scene graph root
- `objects: Map<number, Object3D>` - Objects registry by ID
- `objectsByName: Map<string, Object3D>` - Objects registry by name
- `cameras: Camera[]` - Available cameras
- `activeCamera: Camera | null` - Currently active camera
- `lights: Light[]` - Scene lights
- `background: { r: number, g: number, b: number, a: number }` - Background color
- `ambientLight: { intensity: number, color: { r: number, g: number, b: number } }` - Ambient lighting
- `fog: FogSettings` - Fog settings
- `clock: Clock` - Animation clock
- `paused: boolean` - Animation pause state
- `autoUpdate: boolean` - Auto update enabled
- `autoRender: boolean` - Auto render enabled
- `metrics: SceneMetrics` - Performance metrics

**Methods:**
- `addObject(object, name?)` - Add object to scene
- `removeObject(objectOrId)` - Remove object from scene
- `getObjectByName(name)` - Get object by name
- `getObjectById(id)` - Get object by ID
- `addCamera(camera)` - Add camera to scene
- `removeCamera(camera)` - Remove camera from scene
- `setActiveCamera(camera)` - Set active camera
- `addLight(light)` - Add light to scene
- `removeLight(light)` - Remove light from scene
- `render(renderer, camera)` - Render scene
- `update(deltaTime)` - Update scene
- `emit(event, data?)` - Emit event
- `on(event, listener)` - Add event listener
- `off(event, listener)` - Remove event listener
- `dispose()` - Clean up resources

### WebGLRenderer
**Description:** Comprehensive WebGL renderer with context management, shader compilation, and optimization features.

**Constructor:** `new WebGLRenderer(canvas, options)`

**Options:**
- `antialias: boolean = true` - Enable antialiasing
- `alpha: boolean = false` - Enable alpha channel
- `depth: boolean = true` - Enable depth buffer
- `stencil: boolean = false` - Enable stencil buffer
- `powerPreference: 'high-performance' | 'low-power' = 'high-performance'` - GPU preference
- `failIfMajorPerformanceCaveat: boolean = false` - Fail if no hardware acceleration
- `preserveDrawingBuffer: boolean = false` - Preserve drawing buffer

**Properties:**
- `canvas: HTMLCanvasElement` - Target canvas element
- `context: WebGLRenderingContext` - WebGL context
- `capabilities: WebGLCapabilities` - GPU capabilities
- `clearColor: { r: number, g: number, b: number, a: number }` - Clear color
- `clearDepth: number` - Clear depth value
- `autoClear: boolean` - Auto clear enabled
- `performance: PerformanceMetrics` - Performance data
- `errors: string[]` - Error messages
- `debugMode: boolean` - Debug mode enabled

**Methods:**
- `init()` - Initialize renderer
- `render(scene, camera)` - Render scene
- `setSize(width, height)` - Set renderer size
- `setPixelRatio(ratio)` - Set pixel ratio
- `setClearColor(color, alpha?)` - Set clear color
- `clear()` - Clear framebuffer
- `dispose()` - Clean up resources
- `compileShader(source, type)` - Compile shader
- `createProgram(vertexShader, fragmentShader)` - Create shader program
- `getContext()` - Get WebGL context
- `getCapabilities()` - Get GPU capabilities
- `checkError()` - Check for WebGL errors

### Material
**Description:** Base class for all materials. Manages shader programs and material properties.

**Constructor:** `new Material(shader)`

**Properties:**
- `shader: Shader` - Associated shader
- `properties: Map<string, any>` - Material properties
- `textures: Map<string, TextureBinding>` - Associated textures
- `blending: BlendingSettings` - Blending configuration
- `depthTest: boolean` - Enable depth testing
- `depthWrite: boolean` - Enable depth writing
- `transparent: boolean` - Enable transparency
- `opacity: number` - Material opacity
- `id: number` - Unique material ID

**Methods:**
- `setProperty(name, value)` - Set property
- `getProperty(name)` - Get property
- `setProperties(properties)` - Set multiple properties
- `setUniform(name, value)` - Set uniform value
- `getUniform(name)` - Get uniform value
- `setTexture(name, texture, unit?)` - Set texture
- `removeTexture(name)` - Remove texture
- `clone()` - Clone material
- `dispose()` - Clean up resources
- `needsUpdate()` - Mark for update

### Mesh
**Description:** Represents a 3D object with geometry and material.

**Constructor:** `new Mesh(geometry, material)`

**Properties:**
- `geometry: BufferGeometry` - Mesh geometry
- `material: Material` - Mesh material
- `position: Vector3` - Position in 3D space
- `rotation: Euler` - Rotation angles
- `scale: Vector3` - Scale factors
- `visible: boolean` - Visibility state
- `castShadow: boolean` - Cast shadows
- `receiveShadow: boolean` - Receive shadows
- `layers: Layers` - Layer membership
- `matrix: Matrix4` - World transformation matrix
- `matrixWorld: Matrix4` - World transformation matrix

**Methods:**
- `addChild(object)` - Add child object
- `removeChild(object)` - Remove child object
- `lookAt(target)` - Look at target
- `getWorldPosition(target)` - Get world position
- `getWorldQuaternion(target)` - Get world rotation
- `getWorldScale(target)` - Get world scale
- `raycast(raycaster)` - Perform raycast
- `clone(recursive?)` - Clone mesh
- `dispose()` - Clean up resources
- `updateMatrix()` - Update transformation matrix
- `updateMatrixWorld()` - Update world transformation matrix

### BufferGeometry
**Description:** Geometry class for storing attribute data in buffers.

**Constructor:** `new BufferGeometry()`

**Properties:**
- `attributes: Map<string, BufferAttribute>` - Named attributes
- `index: BufferAttribute | null` - Index buffer
- `boundingBox: Box3 | null` - Bounding box
- `boundingSphere: Sphere | null` - Bounding sphere
- `drawRange: { start: number, count: number }` - Draw range
- `groups: BufferGeometryGroup[]` - Geometry groups
- `morphAttributes: Map<string, BufferAttribute[]>` - Morph targets

**Methods:**
- `addAttribute(name, attribute)` - Add attribute
- `removeAttribute(name)` - Remove attribute
- `getAttribute(name)` - Get attribute
- `hasAttribute(name)` - Check attribute exists
- `setIndex(index)` - Set index buffer
- `computeBoundingBox()` - Compute bounding box
- `computeBoundingSphere()` - Compute bounding sphere
- `merge(geometry)` - Merge geometry
- `clone()` - Clone geometry
- `dispose()` - Clean up resources

---

## Geometry Classes

### BoxGeometry
**Description:** Box-shaped geometry primitive.

**Constructor:** `new BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)`

**Parameters:**
- `width: number = 1` - Box width
- `height: number = 1` - Box height
- `depth: number = 1` - Box depth
- `widthSegments: number = 1` - Width subdivisions
- `heightSegments: number = 1` - Height subdivisions
- `depthSegments: number = 1` - Depth subdivisions

### SphereGeometry
**Description:** Sphere-shaped geometry primitive.

**Constructor:** `new SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength)`

**Parameters:**
- `radius: number = 1` - Sphere radius
- `widthSegments: number = 8` - Horizontal segments
- `heightSegments: number = 6` - Vertical segments
- `phiStart: number = 0` - Start phi angle
- `phiLength: number = Math.PI * 2` - Phi angle span
- `thetaStart: number = 0` - Start theta angle
- `thetaLength: number = Math.PI` - Theta angle span

### PlaneGeometry
**Description:** Plane-shaped geometry primitive.

**Constructor:** `new PlaneGeometry(width, height, widthSegments, heightSegments)`

**Parameters:**
- `width: number = 1` - Plane width
- `height: number = 1` - Plane height
- `widthSegments: number = 1` - Width subdivisions
- `heightSegments: number = 1` - Height subdivisions

### CylinderGeometry
**Description:** Cylinder-shaped geometry primitive.

**Constructor:** `new CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)`

**Parameters:**
- `radiusTop: number = 1` - Top radius
- `radiusBottom: number = 1` - Bottom radius
- `height: number = 2` - Cylinder height
- `radialSegments: number = 8` - Radial segments
- `heightSegments: number = 1` - Height segments
- `openEnded: boolean = false` - Open ended cylinder

### CircleGeometry
**Description:** Circle-shaped geometry primitive.

**Constructor:** `new CircleGeometry(radius, segments, thetaStart, thetaLength)`

**Parameters:**
- `radius: number = 1` - Circle radius
- `segments: number = 8` - Number of segments
- `thetaStart: number = 0` - Start angle
- `thetaLength: number = Math.PI * 2` - Angle span

### ConeGeometry
**Description:** Cone-shaped geometry primitive.

**Constructor:** `new ConeGeometry(radius, height, radialSegments, heightSegments, openEnded)`

**Parameters:**
- `radius: number = 1` - Base radius
- `height: number = 2` - Cone height
- `radialSegments: number = 8` - Radial segments
- `heightSegments: number = 1` - Height segments
- `openEnded: boolean = false` - Open ended cone

### BezierCurve
**Description:** Cubic Bezier curve for creating smooth curves.

**Constructor:** `new BezierCurve(p0, p1, p2, p3)`

**Parameters:**
- `p0: Vector3` - Start point
- `p1: Vector3` - First control point
- `p2: Vector3` - Second control point
- `p3: Vector3` - End point

### Spline
**Description:** Spline curve for creating smooth paths.

**Constructor:** `new Spline(points, closed, tension)`

**Parameters:**
- `points: Vector3[]` - Control points
- `closed: boolean = false` - Closed curve
- `tension: number = 0.5` - Curve tension

---

## Material Classes

### MeshBasicMaterial
**Description:** Unlit material that doesn't respond to lights.

**Constructor:** `new MeshBasicMaterial(options)`

**Properties:**
- `color: Color` - Base color
- `opacity: number` - Opacity (0-1)
- `transparent: boolean` - Enable transparency
- `alphaTest: number` - Alpha test threshold
- `side: Side` - Render side (FrontSide, BackSide, DoubleSide)

**Example:**
```javascript
const material = new MeshBasicMaterial({
    color: '#ff0000',
    opacity: 0.8,
    transparent: true
});
```

### MeshLambertMaterial
**Description:** Material with Lambertian diffuse lighting.

**Constructor:** `new MeshLambertMaterial(options)`

**Properties:**
- `color: Color` - Base color
- `emissive: Color` - Emissive color
- `emissiveIntensity: number` - Emissive intensity
- `ambient: Color` - Ambient color
- `ambientIntensity: number` - Ambient intensity
- `map: Texture` - Diffuse map
- `normalMap: Texture` - Normal map

### MeshPhongMaterial
**Description:** Material with Phong shading model.

**Constructor:** `new MeshPhongMaterial(options)`

**Properties:**
- `color: Color` - Base color
- `emissive: Color` - Emissive color
- `emissiveIntensity: number` - Emissive intensity
- `specular: Color` - Specular color
- `shininess: number` - Specular exponent
- `normalMap: Texture` - Normal map
- `displacementMap: Texture` - Displacement map
- `bumpMap: Texture` - Bump map
- `bumpScale: number` - Bump scale

### MeshStandardMaterial
**Description:** Physically-based rendering material.

**Constructor:** `new MeshStandardMaterial(options)`

**Properties:**
- `color: Color` - Base color
- `metalness: number` - Metalness (0-1)
- `roughness: number` - Roughness (0-1)
- `map: Texture` - Base color map
- `normalMap: Texture` - Normal map
- `roughnessMap: Texture` - Roughness map
- `metalnessMap: Texture` - Metalness map
- `aoMap: Texture` - Ambient occlusion map
- `emissiveMap: Texture` - Emissive map
- `envMap: TextureCube` - Environment map
- `envMapIntensity: number` - Environment map intensity

### MeshPhysicalMaterial
**Description:** Advanced PBR material with physical properties.

**Constructor:** `new MeshPhysicalMaterial(options)`

**Properties:**
- `color: Color` - Base color
- `metalness: number` - Metalness
- `roughness: number` - Roughness
- `clearcoat: number` - Clearcoat intensity
- `clearcoatRoughness: number` - Clearcoat roughness
- `ior: number` - Index of refraction
- `transmission: number` - Transmission
- `thickness: number` - Material thickness
- `specularIntensity: number` - Specular intensity
- `specularColor: Color` - Specular color

### SubsurfaceScatteringMaterial
**Description:** Material for simulating subsurface scattering.

**Constructor:** `new SubsurfaceScatteringMaterial(options)`

**Properties:**
- `subsurfaceColor: Color` - Subsurface color
- `subsurfaceIntensity: number` - Scattering intensity
- `subsurfaceRadius: number` - Scattering radius
- `thickness: number` - Material thickness
- `absorption: Color` - Absorption color
- `transmission: number` - Transmission factor

### IridescenceMaterial
**Description:** Material with iridescent effects.

**Constructor:** `new IridescenceMaterial(options)`

**Properties:**
- `iridescence: number` - Iridescence intensity
- `iridescenceIor: number` - Iridescence index of refraction
- `iridescenceThickness: number` - Film thickness
- `iridescenceColor: Color` - Iridescent color

### ClearcoatMaterial
**Description:** Material with clearcoat layer.

**Constructor:** `new ClearcoatMaterial(options)`

**Properties:**
- `clearcoat: number` - Clearcoat intensity
- `clearcoatIor: number` - Clearcoat index of refraction
- `clearcoatRoughness: number` - Clearcoat roughness
- `clearcoatSpecularIntensity: number` - Clearcoat specular intensity
- `clearcoatSpecularColor: Color` - Clearcoat specular color

### AnisotropicMaterial
**Description:** Material for anisotropic reflections.

**Constructor:** `new AnisotropicMaterial(options)`

**Properties:**
- `anisotropy: number` - Anisotropy strength
- `anisotropyDirection: Vector2` - Anisotropy direction
- `sheenColor: Color` - Sheen color
- `sheenRoughness: number` - Sheen roughness

### ClothMaterial
**Description:** Material for fabric and cloth simulation.

**Constructor:** `new ClothMaterial(options)`

**Properties:**
- `fiberIntensity: number` - Fiber intensity
- `weaveDensity: number` - Weave density
- `fiberDirection: Vector2` - Fiber direction
- `sheen: number` - Fabric sheen
- `subsurface: number` - Subsurface scattering
- `fuzz: number` - Fabric fuzz

---

## Camera Classes

### Camera
**Description:** Base camera class for all camera types.

**Constructor:** `new Camera()`

**Properties:**
- `position: Vector3` - Camera position
- `target: Vector3` - Look target
- `up: Vector3` - Up vector
- `near: number` - Near clipping plane
- `far: number` - Far clipping plane
- `matrix: Matrix4` - View matrix
- `matrixWorld: Matrix4` - World matrix
- `projectionMatrix: Matrix4` - Projection matrix

**Methods:**
- `lookAt(target)` - Look at target
- `updateMatrix()` - Update view matrix
- `updateProjectionMatrix()` - Update projection matrix
- `getWorldPosition(target)` - Get world position
- `getWorldDirection(target)` - Get forward direction
- `clone()` - Clone camera

### PerspectiveCamera
**Description:** Perspective camera with field of view.

**Constructor:** `new PerspectiveCamera(fov, aspect, near, far)`

**Parameters:**
- `fov: number = 75` - Field of view in degrees
- `aspect: number = 1` - Aspect ratio
- `near: number = 0.1` - Near clipping plane
- `far: number = 1000` - Far clipping plane

**Properties:**
- `fov: number` - Field of view
- `aspect: number` - Aspect ratio
- `zoom: number` - Zoom factor

**Methods:**
- `setFov(fov)` - Set field of view
- `setAspect(aspect)` - Set aspect ratio
- `updateProjectionMatrix()` - Update projection matrix

### OrthographicCamera
**Description:** Orthographic camera without perspective distortion.

**Constructor:** `new OrthographicCamera(left, right, top, bottom, near, far)`

**Parameters:**
- `left: number` - Left frustum
- `right: number` - Right frustum
- `top: number` - Top frustum
- `bottom: number` - Bottom frustum
- `near: number` - Near clipping plane
- `far: number` - Far clipping plane

**Properties:**
- `left: number` - Left frustum
- `right: number` - Right frustum
- `top: number` - Top frustum
- `bottom: number` - Bottom frustum

**Methods:**
- `setSize(width, height)` - Set frustum size
- `updateProjectionMatrix()` - Update projection matrix

---

## Light Classes

### Light
**Description:** Base class for all light types.

**Constructor:** `new Light(color, intensity)`

**Properties:**
- `color: Color` - Light color
- `intensity: number` - Light intensity
- `position: Vector3` - Light position
- `castShadow: boolean` - Cast shadows
- `shadowMapSize: Vector2` - Shadow map size
- `shadowBias: number` - Shadow bias
- `shadowNormalBias: number` - Shadow normal bias

### AmbientLight
**Description:** Ambient light that illuminates all objects equally.

**Constructor:** `new AmbientLight(color, intensity)`

**Properties:**
- `color: Color = 0xffffff` - Light color
- `intensity: number = 1` - Light intensity

### DirectionalLight
**Description:** Directional light that shines in a specific direction.

**Constructor:** `new DirectionalLight(color, intensity)`

**Properties:**
- `color: Color = 0xffffff` - Light color
- `intensity: number = 1` - Light intensity
- `target: Object3D` - Light target
- `shadow: DirectionalLightShadow` - Shadow settings

**Methods:**
- `lookAt(target)` - Point light at target

### PointLight
**Description:** Point light that radiates in all directions from a point.

**Constructor:** `new PointLight(color, intensity, distance, decay)`

**Properties:**
- `color: Color = 0xffffff` - Light color
- `intensity: number = 1` - Light intensity
- `distance: number = 0` - Light distance (0 = infinite)
- `decay: number = 2` - Light decay

### SpotLight
**Description:** Spotlight that illuminates objects within a cone.

**Constructor:** `new SpotLight(color, intensity, distance, angle, penumbra, decay)`

**Properties:**
- `color: Color = 0xffffff` - Light color
- `intensity: number = 1` - Light intensity
- `distance: number = 0` - Light distance
- `angle: number = Math.PI / 3` - Spotlight angle
- `penumbra: number = 0` - Penumbra
- `decay: number = 2` - Light decay
- `target: Object3D` - Light target

---

## Animation Classes

### AnimationMixer
**Description:** Animation mixer for playing multiple animations.

**Constructor:** `new AnimationMixer(root)`

**Methods:**
- `clipAction(clip, root?)` - Create animation action
- `update(deltaTime)` - Update animations
- `stopAllAction()` - Stop all animations
- `uncacheClip(clip)` - Remove clip from cache

### AnimationAction
**Description:** Represents an animation being played.

**Constructor:** `new AnimationAction(clip, mixer, root)`

**Methods:**
- `play()` - Start playing
- `stop()` - Stop playing
- `pause()` - Pause animation
- `resume()` - Resume animation
- `reset()` - Reset to beginning
- `setLoop(loop, repetitions)` - Set loop mode
- `setEffectiveWeight(weight)` - Set animation weight
- `fadeIn(duration)` - Fade in
- `fadeOut(duration)` - Fade out

### KeyframeTrack
**Description:** Base class for keyframe animation tracks.

**Constructor:** `new KeyframeTrack(name, times, values)`

**Parameters:**
- `name: string` - Property name to animate
- `times: number[]` - Keyframe times
- `values: number[]` - Keyframe values

**Types:**
- `NumberKeyframeTrack` - Numeric values
- `VectorKeyframeTrack` - Vector3 values
- `QuaternionKeyframeTrack` - Quaternion values
- `BooleanKeyframeTrack` - Boolean values
- `StringKeyframeTrack` - String values

---

## Loader Classes

### Loader
**Description:** Base class for all loaders.

**Constructor:** `new Loader()`

**Properties:**
- `crossOrigin: string` - CORS mode
- `path: string` - Base path
- `manager: LoadingManager` - Loading manager

**Methods:**
- `load(url, onLoad, onProgress, onError)` - Load resource
- `parse(json)` - Parse JSON data
- `setCrossOrigin(crossOrigin)` - Set CORS mode
- `setPath(path)` - Set base path

### FileLoader
**Description:** Generic file loader for text/binary data.

**Constructor:** `new FileLoader(manager)`

**Methods:**
- `load(url, onLoad, onProgress, onError)` - Load file
- `setResponseType(type)` - Set response type
- `setMimeType(mimeType)` - Set MIME type

### TextureLoader
**Description:** Loads texture images.

**Constructor:** `new TextureLoader(manager)`

**Methods:**
- `load(url, onLoad, onProgress, onError)` - Load texture
- `loadAsync(url)` - Load texture asynchronously
- `setCrossOrigin(crossOrigin)` - Set CORS mode

### GLTFLoader
**Description:** Loads GLTF/GLB 3D models.

**Constructor:** `new GLTFLoader(manager)`

**Methods:**
- `load(url, onLoad, onProgress, onError)` - Load GLTF
- `loadAsync(url)` - Load GLTF asynchronously
- `parse(gltf)` - Parse GLTF data
- `parseAsync(gltf)` - Parse GLTF asynchronously

### OBJLoader
**Description:** Loads Wavefront OBJ files.

**Constructor:** `new OBJLoader(manager)`

**Methods:**
- `load(url, onLoad, onProgress, onError)` - Load OBJ
- `loadAsync(url)` - Load OBJ asynchronously
- `parse(text)` - Parse OBJ text

### MTLLoader
**Description:** Loads Wavefront MTL material files.

**Constructor:** `new MTLLoader(manager)`

**Methods:**
- `load(url, onLoad, onProgress, onError)` - Load MTL
- `loadAsync(url)` - Load MTL asynchronously
- `parse(text)` - Parse MTL text
- `preload()` - Preload materials

---

## Particle System Classes

### ParticleSystem
**Description:** High-performance particle system for effects.

**Constructor:** `new ParticleSystem(options)`

**Properties:**
- `particleCount: number` - Number of particles
- `lifetime: number` - Particle lifetime
- `emissionRate: number` - Particles per second
- `maxParticles: number` - Maximum particles
- `autoUpdate: boolean` - Auto update enabled

**Methods:**
- `addEmitter(emitter)` - Add particle emitter
- `removeEmitter(emitter)` - Remove particle emitter
- `start()` - Start particle system
- `stop()` - Stop particle system
- `clear()` - Clear all particles
- `update(deltaTime)` - Update particles

### GPUParticleSystem
**Description:** GPU-accelerated particle system.

**Constructor:** `new GPUParticleSystem(options)`

**Features:**
- Up to 1 million particles
- GPU-based simulation
- Supports custom shaders
- Real-time performance

### ParticleEmitter
**Description:** Emits particles from a source.

**Constructor:** `new ParticleEmitter(options)`

**Properties:**
- `position: Vector3` - Emitter position
- `velocity: Vector3` - Initial velocity
- `acceleration: Vector3` - Acceleration
- `color: Color` - Particle color
- `size: number` - Particle size
- `lifetime: number` - Particle lifetime

**Methods:**
- `setPosition(position)` - Set emitter position
- `setVelocity(velocity)` - Set initial velocity
- `setColor(color)` - Set particle color
- `setSize(size)` - Set particle size
- `setLifetime(lifetime)` - Set particle lifetime

### FluidSimulation
**Description:** 2D/3D fluid simulation system.

**Constructor:** `new FluidSimulation(width, height, options)`

**Parameters:**
- `width: number` - Simulation width
- `height: number` - Simulation height
- `options: FluidOptions` - Simulation options

**Methods:**
- `addVelocity(x, y, vx, vy)` - Add velocity
- `addDensity(x, y, density)` - Add density
- `step()` - Run simulation step
- `getVelocity(x, y)` - Get velocity at position
- `getDensity(x, y)` - Get density at position

---

## Physics Classes

### PhysicsSystem
**Description:** Physics simulation system.

**Constructor:** `new PhysicsSystem(options)`

**Properties:**
- `gravity: Vector3` - Gravity vector
- `timeStep: number` - Fixed time step
- `maxSubSteps: number` - Maximum sub-steps
- `allowSleep: boolean` - Allow body sleeping

**Methods:**
- `addRigidBody(body)` - Add rigid body
- `removeRigidBody(body)` - Remove rigid body
- `step(deltaTime)` - Advance physics simulation
- `setGravity(gravity)` - Set gravity
- `worldToLocal(point)` - Convert world to local coordinates
- `localToWorld(point)` - Convert local to world coordinates

### RigidBody
**Description:** Rigid body for physics simulation.

**Constructor:** `new RigidBody(shape, mass, options)`

**Properties:**
- `shape: CollisionShape` - Collision shape
- `mass: number` - Body mass
- `position: Vector3` - Body position
- `rotation: Quaternion` - Body rotation
- `velocity: Vector3` - Linear velocity
- `angularVelocity: Vector3` - Angular velocity
- `isStatic: boolean` - Static body flag

**Methods:**
- `applyForce(force, point)` - Apply force
- `applyImpulse(impulse, point)` - Apply impulse
- `setPosition(position)` - Set position
- `setRotation(rotation)` - Set rotation
- `getLinearVelocity()` - Get linear velocity
- `getAngularVelocity()` - Get angular velocity

---

## Control Classes

### OrbitControls
**Description:** Mouse/touch orbit controls for cameras.

**Constructor:** `new OrbitControls(camera, domElement)`

**Properties:**
- `enabled: boolean` - Controls enabled
- `enableDamping: boolean` - Enable damping
- `dampingFactor: number` - Damping factor
- `enableZoom: boolean` - Enable zoom
- `enableRotate: boolean` - Enable rotation
- `enablePan: boolean` - Enable panning
- `minDistance: number` - Minimum distance
- `maxDistance: number` - Maximum distance
- `minPolarAngle: number` - Minimum polar angle
- `maxPolarAngle: number` - Maximum polar angle

**Methods:**
- `update()` - Update controls
- `reset()` - Reset to default
- `saveState()` - Save current state
- `restoreState()` - Restore saved state

---

## Texture Classes

### Texture
**Description:** Base class for all textures.

**Constructor:** `new Texture(image, options)`

**Properties:**
- `image: HTMLImageElement | HTMLCanvasElement | ImageData` - Source image
- `width: number` - Texture width
- `height: number` - Texture height
- `format: TextureFormat` - Pixel format
- `type: TextureType` - Data type
- `wrapS: WrappingMode` - Horizontal wrap mode
- `wrapT: WrappingMode` - Vertical wrap mode
- `magFilter: FilterMode` - Magnification filter
- `minFilter: FilterMode` - Minification filter
- `anisotropy: number` - Anisotropy level

**Methods:**
- `dispose()` - Clean up texture
- `needsUpdate` - Mark for update
- `clone()` - Clone texture

### CubeTexture
**Description:** Cube map texture with 6 faces.

**Constructor:** `new CubeTexture(images, options)`

**Parameters:**
- `images: (HTMLImageElement | HTMLCanvasElement)[]` - 6 face images
- `options: TextureOptions` - Texture options

### CompressedTexture
**Description:** Compressed texture format support.

**Constructor:** `new CompressedTexture(data, width, height, format)`

**Formats:**
- `DXT1`, `DXT3`, `DXT5` (Desktop)
- `ATC`, `ATC_RGB`, `ATC_RGBA` (Mobile)
- `ASTC` (Modern mobile)
- `ETC1`, `ETC2` (Android)

---

## Utility Classes

### EventEmitter
**Description:** High-performance event system.

**Constructor:** `new EventEmitter()`

**Methods:**
- `on(event, listener, options?)` - Add event listener
- `once(event, listener, options?)` - Add one-time listener
- `off(event, listener)` - Remove event listener
- `emit(event, data?)` - Emit event
- `removeAllListeners(event?)` - Remove all listeners

### PerformanceTimer
**Description:** High-resolution performance timing.

**Constructor:** `new PerformanceTimer()`

**Methods:**
- `start()` - Start timer
- `stop()` - Stop timer
- `reset()` - Reset timer
- `elapsed()` - Get elapsed time
- `getTimestamp()` - Get high-resolution timestamp

### MemoryMonitor
**Description:** WebGL memory usage monitoring.

**Constructor:** `new MemoryMonitor(renderer)`

**Methods:**
- `getTextureMemory()` - Get texture memory usage
- `getBufferMemory()` - Get buffer memory usage
- `getTotalMemory()` - Get total memory usage
- `logMemoryUsage()` - Log current usage

### Color
**Description:** Color representation and manipulation.

**Constructor:** `new Color(r, g, b)` or `new Color(colorString)`

**Methods:**
- `set(color)` - Set color value
- `setHex(hex)` - Set from hex
- `setRGB(r, g, b)` - Set from RGB
- `setHSL(h, s, l)` - Set from HSL
- `getHex()` - Get hex value
- `getRGB()` - Get RGB array
- `getHSL()` - Get HSL array
- `clone()` - Clone color
- `copy(color)` - Copy color

### Vector2
**Description:** 2D vector mathematics.

**Constructor:** `new Vector2(x, y)`

**Properties:**
- `x: number` - X component
- `y: number` - Y component

**Methods:**
- `set(x, y)` - Set components
- `copy(v)` - Copy vector
- `add(v)` - Add vector
- `subtract(v)` - Subtract vector
- `multiplyScalar(s)` - Multiply by scalar
- `divideScalar(s)` - Divide by scalar
- `normalize()` - Normalize vector
- `length()` - Get vector length
- `distanceTo(v)` - Distance to other vector
- `clone()` - Clone vector

### Vector3
**Description:** 3D vector mathematics.

**Constructor:** `new Vector3(x, y, z)`

**Properties:**
- `x: number` - X component
- `y: number` - Y component
- `z: number` - Z component

**Methods:**
- `set(x, y, z)` - Set components
- `copy(v)` - Copy vector
- `add(v)` - Add vector
- `subtract(v)` - Subtract vector
- `multiplyScalar(s)` - Multiply by scalar
- `divideScalar(s)` - Divide by scalar
- `normalize()` - Normalize vector
- `cross(v)` - Cross product
- `dot(v)` - Dot product
- `length()` - Get vector length
- `distanceTo(v)` - Distance to other vector
- `clone()` - Clone vector

### Matrix4
**Description:** 4x4 matrix for transformations.

**Constructor:** `new Matrix4()`

**Methods:**
- `identity()` - Set to identity
- `copy(m)` - Copy matrix
- `multiply(m)` - Multiply matrix
- `multiplyScalar(s)` - Multiply by scalar
- `transpose()` - Transpose matrix
- `invert()` - Invert matrix
- `determinant()` - Get determinant
- `decompose(position, rotation, scale)` - Decompose into components
- `lookAt(eye, center, up)` - Set view matrix
- `perspective(fov, aspect, near, far)` - Set perspective matrix
- `orthographic(left, right, top, bottom, near, far)` - Set orthographic matrix

### Euler
**Description:** Euler angles for rotations.

**Constructor:** `new Euler(x, y, z, order)`

**Properties:**
- `x: number` - X rotation
- `y: number` - Y rotation
- `z: number` - Z rotation
- `order: RotationOrder` - Rotation order

**Methods:**
- `set(x, y, z, order)` - Set angles
- `copy(e)` - Copy euler
- `setFromRotationMatrix(m, order)` - Set from rotation matrix
- `setFromQuaternion(q, order)` - Set from quaternion
- `toQuaternion()` - Convert to quaternion
- `clone()` - Clone euler

### Quaternion
**Description:** Quaternion for rotations.

**Constructor:** `new Quaternion(x, y, z, w)`

**Properties:**
- `x: number` - X component
- `y: number` - Y component
- `z: number` - Z component
- `w: number` - W component

**Methods:**
- `set(x, y, z, w)` - Set components
- `copy(q)` - Copy quaternion
- `multiply(q)` - Multiply quaternion
- `multiplyScalar(s)` - Multiply by scalar
- `normalize()` - Normalize
- `invert()` - Invert
- `conjugate()` - Conjugate
- `dot(q)` - Dot product
- `length()` - Get length
- `setFromEuler(e)` - Set from euler angles
- `setFromAxisAngle(axis, angle)` - Set from axis-angle
- `setFromRotationMatrix(m)` - Set from rotation matrix
- `toEuler()` - Convert to euler angles
- `clone()` - Clone quaternion

---

## Event System

### Event Types

#### Scene Events
- `objectAdded` - Object added to scene
- `objectRemoved` - Object removed from scene
- `cameraChanged` - Active camera changed
- `lightAdded` - Light added to scene
- `lightRemoved` - Light removed from scene
- `frameUpdate` - Frame update tick
- `sceneDispose` - Scene disposed

#### Mesh Events
- `added` - Mesh added to parent
- `removed` - Mesh removed from parent
- `transformChanged` - Transform updated
- `visibilityChanged` - Visibility changed
- `materialChanged` - Material changed
- `geometryChanged` - Geometry changed

#### Material Events
- `propertyChanged` - Material property changed
- `textureChanged` - Texture changed
- `shaderCompiled` - Shader compilation complete
- `dispose` - Material disposed

#### Animation Events
- `play` - Animation started
- `pause` - Animation paused
- `resume` - Animation resumed
- `stop` - Animation stopped
- `complete` - Animation completed
- `loop` - Animation looped

#### Loading Events
- `loadStart` - Loading started
- `loadProgress` - Loading progress
- `loadComplete` - Loading completed
- `loadError` - Loading error

#### Input Events
- `click` - Mouse click
- `mousedown` - Mouse button pressed
- `mouseup` - Mouse button released
- `mousemove` - Mouse moved
- `wheel` - Mouse wheel
- `touchstart` - Touch started
- `touchmove` - Touch moved
- `touchend` - Touch ended
- `keydown` - Key pressed
- `keyup` - Key released

---

## Constants

### Texture Constants
```javascript
// Pixel formats
const RGBAFormat = 1021;
const RGBFormat = 1020;
const RedFormat = 1021;
const DepthFormat = 1026;
const DepthStencilFormat = 1027;

// Data types
const UnsignedByteType = 1009;
const ByteType = 1008;
const ShortType = 1003;
const UnsignedShortType = 1004;
const IntType = 1005;
const UnsignedIntType = 1006;
const FloatType = 1010;
const HalfFloatType = 1011;
const DoubleType = 1012;
const UnsignedShort4444Type = 1014;
const UnsignedShort5551Type = 1015;
const UnsignedShort565Type = 1016;

// Wrapping modes
const RepeatWrapping = 1000;
const ClampToEdgeWrapping = 1001;
const MirroredRepeatWrapping = 1002;

// Filter modes
const NearestFilter = 1003;
const NearestMipmapNearestFilter = 1004;
const NearestMipmapLinearFilter = 1005;
const LinearFilter = 1006;
const LinearMipmapNearestFilter = 1007;
const LinearMipmapLinearFilter = 1008;
```

### Color Space
```javascript
const SRGBColorSpace = 'srgb';
const LinearSRGBColorSpace = 'srgb-linear';
const DisplayP3ColorSpace = 'display-p3';
const A98ColorSpace = 'a98-rgb';
const ProPhotoRGBColorSpace = 'prophoto-rgb';
```

### Render Modes
```javascript
const TrianglesDrawMode = 0;
const TriangleStripDrawMode = 1;
const TriangleFanDrawMode = 2;
```

### Animation Loop Modes
```javascript
const LoopOnce = 2200;
const LoopRepeat = 2201;
const LoopPingPong = 2202;
```

### Shadow Types
```javascript
const BasicShadowMap = 0;
const PCFShadowMap = 1;
const PCFSoftShadowMap = 2;
const VSMShadowMap = 3;
```

This comprehensive reference covers all major classes, methods, properties, and functions in the Ninth.js WebGL 3D library. Each section provides detailed information about usage, parameters, and examples to help developers use the library effectively.