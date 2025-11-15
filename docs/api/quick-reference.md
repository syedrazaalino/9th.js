# 9th.js API Quick Reference

This quick reference guide provides a comprehensive overview of all classes, their main methods, and common use cases.

## Core API

### Engine
**Main application controller**
- `new Engine(canvas, config)` - Initialize engine
- `start()` - Begin render loop
- `stop()` - End render loop
- `resize(width, height)` - Adjust canvas size
- `setCamera(camera)` - Set active camera
- `getPerformance()` - Get performance stats
- `dispose()` - Cleanup resources

**Use case:** Initialize and manage 3D application

### Scene
**Container for all 3D objects**
- `add(object)` - Add object to scene
- `remove(object)` - Remove object from scene
- `traverse(callback)` - Process all objects
- `getObjectByName(name)` - Find object by name
- `getObjectsByProperty(prop, value)` - Find by property
- `update(deltaTime)` - Update scene objects

**Use case:** Organize and manage 3D scene graph

### WebGLRenderer
**WebGL rendering system**
- `render(scene, camera)` - Render scene
- `setSize(width, height)` - Resize renderer
- `getContext()` - Access WebGL context
- `setPixelRatio(ratio)` - Adjust pixel ratio
- `dispose()` - Cleanup renderer

**Use case:** Handle WebGL rendering operations

### Object3D
**Base class for 3D objects**
- `position` - 3D position vector
- `rotation` - Euler rotation angles
- `scale` - Scale factors
- `lookAt(target)` - Point toward target
- `getWorldPosition()` - Get world coordinates
- `getWorldQuaternion()` - Get world rotation

**Use case:** Base class for all 3D objects

### Mesh
**3D geometry object**
- `geometry` - Geometry data
- `material` - Surface material
- `castShadow` - Shadow casting
- `receiveShadow` - Shadow receiving
- `clone()` - Create copy
- `dispose()` - Cleanup

**Use case:** Create visible 3D objects

## Geometry Classes

### BufferGeometry
**Core geometry with buffer attributes**
- `setAttribute(name, attribute)` - Add buffer attribute
- `getAttribute(name)` - Get buffer attribute
- `setIndex(index)` - Set index data
- `computeVertexNormals()` - Calculate normals
- `computeBoundingBox()` - Calculate bounds
- `computeBoundingSphere()` - Calculate sphere

**Use case:** Efficient geometry storage

### BoxGeometry
**Box-shaped geometry**
- `width` - Box width
- `height` - Box height
- `depth` - Box depth
- `widthSegments` - Width subdivisions
- `heightSegments` - Height subdivisions
- `depthSegments` - Depth subdivisions

**Use case:** Create cube and rectangular shapes

### SphereGeometry
**Sphere-shaped geometry**
- `radius` - Sphere radius
- `widthSegments` - Longitude segments
- `heightSegments` - Latitude segments
- `phiStart` - Start angle (phi)
- `phiLength` - Angle length (phi)
- `thetaStart` - Start angle (theta)
- `thetaLength` - Angle length (theta)

**Use case:** Create spheres and spherical shapes

### PlaneGeometry
**Flat plane geometry**
- `width` - Plane width
- `height` - Plane height
- `widthSegments` - Width subdivisions
- `heightSegments` - Height subdivisions

**Use case:** Create flat surfaces and ground planes

### CylinderGeometry
**Cylinder-shaped geometry**
- `radiusTop` - Top radius
- `radiusBottom` - Bottom radius
- `height` - Cylinder height
- `radialSegments` - Radial subdivisions
- `heightSegments` - Height subdivisions
- `openEnded` - Remove top/bottom caps

**Use case:** Create cylinders, cones, and tubes

## Camera Classes

### Camera
**Base camera class**
- `position` - Camera position
- `rotation` - Camera rotation
- `fov` - Field of view
- `near` - Near clipping plane
- `far` - Far clipping plane
- `lookAt(target)` - Point camera at target
- `updateProjectionMatrix()` - Refresh projection

**Use case:** Base for all camera types

### PerspectiveCamera
**Perspective projection camera**
- `fov` - Field of view in degrees
- `aspect` - Aspect ratio (width/height)
- `setFov(fov)` - Set field of view
- `getFov()` - Get field of view
- `setAspect(aspect)` - Set aspect ratio
- `updateProjectionMatrix()` - Update projection

**Use case:** Realistic perspective rendering

### OrthographicCamera
**Orthographic projection camera**
- `left` - Left clipping plane
- `right` - Right clipping plane
- `top` - Top clipping plane
- `bottom` - Bottom clipping plane
- `setViewOffset(...)` - Configure sub-region
- `updateProjectionMatrix()` - Update projection

**Use case:** 2D rendering, CAD, technical visualization

## Material Classes

### Material
**Base material class**
- `color` - Material color
- `opacity` - Transparency (0-1)
- `transparent` - Enable transparency
- `visible` - Material visibility
- `side` - Which faces to render
- `dispose()` - Cleanup material

**Use case:** Base for all material types

### BasicMaterial
**Unlit material**
- `color` - Material color
- `map` - Diffuse texture
- `opacity` - Transparency
- `transparent` - Enable transparency

**Use case:** Simple unlit surfaces, UI elements

### PhongMaterial
**Phong shaded material**
- `color` - Diffuse color
- `specular` - Specular highlight color
- `shininess` - Specular exponent
- `map` - Diffuse texture
- `normalMap` - Normal mapping
- `emissive` - Self-illumination

**Use case:** Classic lighting model

### StandardMaterial
**PBR standard material**
- `color` - Base color/albedo
- `metalness` - Metallic factor (0-1)
- `roughness` - Surface roughness (0-1)
- `map` - Base color texture
- `metalnessMap` - Metallic texture
- `roughnessMap` - Roughness texture
- `normalMap` - Normal mapping
- `aoMap` - Ambient occlusion
- `emissiveMap` - Emission texture
- `envMap` - Environment reflection

**Use case:** Realistic physically-based rendering

### PhysicalMaterial
**Advanced PBR material**
- `clearcoat` - Clearcoat layer intensity
- `clearcoatRoughness` - Clearcoat roughness
- `sheen` - Sheen effect intensity
- `transmission` - Light transmission (glass)
- `thickness` - Material thickness
- `ior` - Index of refraction

**Use case:** Advanced materials like glass, car paint

## Light Classes

### Light
**Base light class**
- `color` - Light color
- `intensity` - Light brightness
- `position` - Light position
- `castShadow` - Shadow casting
- `visible` - Light visibility

**Use case:** Base for all light types

### AmbientLight
**Uniform ambient lighting**
- `color` - Light color
- `intensity` - Light intensity

**Use case:** Overall scene illumination

### DirectionalLight
**Directional light (sun-like)**
- `position` - Light direction
- `target` - Light target position
- `castShadow` - Enable shadows
- `shadow.mapSize` - Shadow map resolution
- `shadow.camera` - Shadow camera settings

**Use case:** Sunlight, parallel light sources

### PointLight
**Point light source**
- `position` - Light position
- `distance` - Light falloff distance
- `decay` - Light decay rate
- `castShadow` - Enable shadows

**Use case:** Light bulbs, explosions

### SpotLight
**Spotlight with angle control**
- `position` - Light position
- `target` - Target position
- `angle` - Spotlight angle
- `penumbra` - Soft edge factor
- `distance` - Light reach
- `castShadow` - Enable shadows

**Use case:** Flashlights, stage lights

### HemisphereLight
**Sky/ground lighting**
- `skyColor` - Sky light color
- `groundColor` - Ground light color
- `intensity` - Light intensity

**Use case:** Natural outdoor lighting

## Math Classes

### Vector3
**3D vector operations**
- `x, y, z` - Vector components
- `set(x, y, z)` - Set components
- `copy(v)` - Copy from vector
- `add(v)` - Add vector
- `subtract(v)` - Subtract vector
- `multiplyScalar(s)` - Scale vector
- `normalize()` - Make unit length
- `length()` - Get vector length
- `distanceTo(v)` - Distance to vector
- `dot(v)` - Dot product
- `cross(v)` - Cross product
- `lerp(v, t)` - Linear interpolation

**Use case:** 3D position, direction, velocity

### Vector2
**2D vector operations**
- `x, y` - Vector components
- `set(x, y)` - Set components
- `add(v)` - Add vector
- `subtract(v)` - Subtract vector
- `multiplyScalar(s)` - Scale vector
- `normalize()` - Make unit length
- `length()` - Get vector length
- `dot(v)` - Dot product
- `lerp(v, t)` - Linear interpolation

**Use case:** 2D coordinates, UV mapping

### Color
**Color representation and manipulation**
- `r, g, b` - RGB components (0-1)
- `h, s, l` - HSL components
- `set(r, g, b)` - Set RGB
- `setHex(hex)` - Set from hex
- `setHSL(h, s, l)` - Set HSL
- `lerp(c, t)` - Color interpolation
- `multiplyScalar(s)` - Scale color
- `clone()` - Copy color

**Use case:** Color manipulation and representation

### Matrix4
**4x4 matrix operations**
- `elements` - Matrix elements array
- `identity()` - Set to identity
- `multiply(m)` - Multiply with matrix
- `multiplyScalar(s)` - Scale matrix
- `determinant()` - Calculate determinant
- `invert()` - Invert matrix
- `transpose()` - Transpose matrix
- `lookAt(eye, target, up)` - Create view matrix
- `perspective(fov, aspect, near, far)` - Create projection
- `compose(position, quaternion, scale)` - Create transform

**Use case:** 3D transformations, camera matrices

### Quaternion
**Quaternion rotation representation**
- `x, y, z, w` - Quaternion components
- `set(x, y, z, w)` - Set components
- `setFromAxisAngle(axis, angle)` - From axis-angle
- `setFromEuler(euler)` - From Euler angles
- `setFromRotationMatrix(m)` - From rotation matrix
- `multiply(q)` - Multiply quaternions
- `invert()` - Invert quaternion
- `normalize()` - Make unit length
- `slerp(q, t)` - Spherical interpolation

**Use case:** Rotation without gimbal lock

### Euler
**Euler angle rotation**
- `x, y, z` - Rotation angles (radians)
- `set(x, y, z)` - Set angles
- `setFromQuaternion(q)` - From quaternion
- `setFromRotationMatrix(m)` - From rotation matrix
- `reorder(newOrder)` - Change rotation order

**Use case:** Human-readable rotations

## Animation Classes

### AnimationClip
**Animation data container**
- `name` - Clip name
- `duration` - Clip duration
- `tracks` - Animation tracks
- `UUID` - Unique identifier

**Use case:** Store animation data

### AnimationMixer
**Animation playback controller**
- `clipAction(clip, root)` - Create animation action
- `update(deltaTime)` - Advance animations
- `stopAllAction()` - Stop all animations
- `uncacheClip(clip)` - Remove clip from cache
- `uncacheRoot(root)` - Remove root from cache

**Use case:** Control animation playback

### AnimationAction
**Individual animation instance**
- `play()` - Start animation
- `stop()` - Stop animation
- `pause()` - Pause animation
- `reset()` - Reset to start
- `setLoop(loop, count)` - Configure looping
- `setEffectiveWeight(weight)` - Set blend weight
- `setEffectiveTimeScale(scale)` - Set playback speed
- `fadeIn(duration)` - Fade in animation
- `fadeOut(duration)` - Fade out animation
- `crossFadeTo(fadeAction, duration, warp)` - Cross fade

**Use case:** Control specific animation instance

### KeyframeTrack
**Keyframe animation data**
- `name` - Target property name
- `times` - Keyframe times
- `values` - Keyframe values
- `setValueAtTime(value, time)` - Set keyframe
- `setInterpolation(interpolation)` - Set interpolation
- `getValueAtTime(time)` - Get interpolated value

**Use case:** Animate specific properties

## Loader Classes

### Loader
**Base loader class**
- `manager` - Loading manager
- `crossOrigin` - CORS setting
- `path` - Base path for resources
- `load(url, onLoad, onProgress, onError)` - Load resource
- `setCrossOrigin(crossOrigin)` - Set CORS
- `setPath(path)` - Set base path

**Use case:** Base for all loaders

### TextureLoader
**Texture loading**
- `load(url, onLoad, onProgress, onError)` - Load texture
- `loadAsync(url)` - Promise-based loading
- `setCrossOrigin(crossOrigin)` - Set CORS

**Use case:** Load image textures

### GLTFLoader
**glTF format loader**
- `load(url, onLoad, onProgress, onError)` - Load glTF
- `parse(json, onLoad)` - Parse from string
- `setDRACOLoader(dracoLoader)` - Set Draco decoder

**Use case:** Load modern 3D formats

### OBJLoader
**OBJ format loader**
- `load(url, onLoad, onProgress, onError)` - Load OBJ
- `parse(text)` - Parse from string
- `setMaterials(mtlLoader)` - Set material loader

**Use case:** Load legacy 3D formats

### MTLLoader
**Material template library loader**
- `load(url, onLoad, onProgress, onError)` - Load MTL
- `parse(text)` - Parse from string
- `setTexturePath(path)` - Set texture path

**Use case:** Load material definitions

## Control Classes

### OrbitControls
**Orbital camera controls**
- `object` - Controlled camera
- `target` - Orbit center point
- `enableDamping` - Enable smooth damping
- `dampingFactor` - Damping amount
- `enableZoom` - Enable zoom
- `minDistance` - Minimum zoom distance
- `maxDistance` - Maximum zoom distance
- `enableRotate` - Enable rotation
- `enablePan` - Enable panning
- `update()` - Update controls

**Use case:** Standard camera navigation

### FirstPersonControls
**First-person camera controls**
- `movementSpeed` - Movement speed
- `lookSpeed` - Look speed
- `lookVertical` - Vertical look enabled
- `activeLook` - Mouse look enabled
- `heightMin` - Minimum height
- `heightMax` - Maximum height
- `autoForward` - Auto-forward movement
- `update()` - Update controls

**Use case:** FPS-style navigation

### DragControls
**Object dragging controls**
- `objects` - Draggable objects
- `transformGroup` - Transform group mode
- `activate()` - Enable dragging
- `deactivate()` - Disable dragging
- `getObjects()` - Get draggable objects

**Use case:** Interactive object manipulation

## Utility Classes

### Clock
**Timing utility**
- `start()` - Start clock
- `stop()` - Stop clock
- `getElapsedTime()` - Get total elapsed time
- `getDelta()` - Get delta time

**Use case:** Animation timing

### Raycaster
**Ray casting for picking**
- `set(origin, direction)` - Set ray
- `setFromCamera(coords, camera)` - Set from camera
- `intersectObject(object, recursive)` - Test intersection
- `intersectObjects(objects, recursive)` - Test multiple
- `params` - Intersection parameters

**Use case:** Object picking and ray testing

### Box3
**Axis-aligned bounding box**
- `min, max` - Box bounds
- `set(min, max)` - Set bounds
- `setFromPoints(points)` - From points
- `setFromObject(object)` - From object
- `expandByScalar(scalar)` - Expand box
- `containsPoint(point)` - Test point containment
- `intersectsBox(box)` - Test box intersection
- `getCenter(target)` - Get center point
- `getSize(target)` - Get box size

**Use case:** Bounding volume calculations

### Sphere
**Bounding sphere**
- `center` - Sphere center
- `radius` - Sphere radius
- `set(center, radius)` - Set sphere
- `setFromPoints(points)` - From points
- `setFromObject(object)` - From object
- `clampPoint(point, target)` - Clamp point to sphere
- `containsPoint(point)` - Test point containment
- `distanceToPoint(point)` - Distance to point

**Use case:** Spherical bounds calculations

---

This quick reference provides a comprehensive overview of the 9th.js API. For detailed information, examples, and usage patterns, refer to the full API documentation and user guides.