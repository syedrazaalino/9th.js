# Buffer and Geometry Management System

A comprehensive WebGL buffer and geometry management system designed for high-performance 3D graphics applications.

## Features

- **Dynamic Buffer Management**: Efficient buffer creation, updates, and disposal
- **Performance Optimization**: Buffer pooling, usage patterns, and subdata updates
- **Interleaved Buffers**: Support for optimized vertex data layouts
- **Geometry Management**: Complete geometry data handling with bounding volume computation
- **Type Safety**: Comprehensive type checking and validation

## Core Classes

### Buffer.js

#### Buffer Class
Base class for all WebGL buffer types.

```javascript
// Create a buffer
const buffer = new Buffer(gl, BufferType.ARRAY_BUFFER, BufferUsage.DYNAMIC_DRAW);

// Upload data
const data = new Float32Array([1, 2, 3, 4, 5, 6]);
buffer.setData(data);

// Dynamic updates
buffer.updateSubData(new Float32Array([7, 8, 9]), 12); // Update at byte offset 12

// Cleanup
buffer.dispose();
```

#### Specialized Buffer Classes

```javascript
// Index buffer for geometry indexing
const indices = new Uint16Array([0, 1, 2, 1, 3, 2]);
const indexBuffer = new IndexBuffer(gl, indices);

// Vertex buffer for vertex data
const vertices = new Float32Array([0, 0, 0, 1, 0, 0, ...]);
const vertexBuffer = new VertexBuffer(gl, vertices);
```

#### BufferPool
Efficient buffer reuse to minimize WebGL resource allocation.

```javascript
const pool = new BufferPool(gl, 10); // Pre-allocate 10 buffers

// Acquire buffer from pool
const buffer = pool.acquire(BufferType.ARRAY_BUFFER, BufferUsage.DYNAMIC_DRAW);

// Use buffer...
pool.release(buffer); // Return to pool
```

### BufferGeometry.js

#### BufferGeometry Class
Manages vertex attributes and geometry data.

```javascript
const geometry = new BufferGeometry(gl);

// Add position attribute
const positionAttr = new VertexAttribute('position', 3, WebGLRenderingContext.FLOAT);
const positions = new Float32Array([...]);
geometry.addAttribute(positionAttr, positions);

// Add normal attribute
const normalAttr = new VertexAttribute('normal', 3, WebGLRenderingContext.FLOAT);
const normals = new Float32Array([...]);
geometry.addAttribute(normalAttr, normals);

// Set indices
const indices = new Uint16Array([...]);
geometry.setIndex(indices);

// Enable for rendering
geometry.enableAttributes(shaderProgram);

// Get geometry info
const info = geometry.getInfo();
console.log(`Vertices: ${info.vertexCount}, Attributes: ${info.attributeCount}`);
```

#### Interleaved Buffers
Optimized single-buffer layout for better GPU performance.

```javascript
// Create interleaved geometry with position, normal, and UV
const geometry = AttributeUtils.createStandardGeometry(gl, positions, normals, uvs);

// Or manually create interleaved layout
const attributes = [
  new VertexAttribute('position', 3),
  new VertexAttribute('normal', 3),
  new VertexAttribute('uv', 2)
];

const interleavedData = new Float32Array([...]); // Combined vertex data
geometry.addInterleavedAttributes(attributes, interleavedData);
```

#### Attribute Utilities
Helper functions for common attribute configurations.

```javascript
// Create standard attributes
const positionAttr = AttributeUtils.createPositionAttribute();
const normalAttr = AttributeUtils.createNormalAttribute();
const uvAttr = AttributeUtils.createUVAttribute();
const colorAttr = AttributeUtils.createColorAttribute(3); // RGB
const tangentAttr = AttributeUtils.createTangentAttribute();
```

## Performance Optimization Tips

1. **Use Appropriate Buffer Usage**:
   - `STATIC_DRAW`: Data rarely changes
   - `DYNAMIC_DRAW`: Data updates frequently
   - `STREAM_DRAW`: Data updates once or few times

2. **Use BufferPool for Dynamic Allocation**:
   - Pre-allocate buffers for frequent creation/destruction
   - Reduce WebGL context overhead

3. **Prefer Interleaved Buffers**:
   - Better GPU cache efficiency
   - Reduced draw calls
   - Improved memory access patterns

4. **Use Subdata Updates for Dynamic Data**:
   - Update only changed portions of buffer
   - Avoid full buffer reallocation

5. **Compute Bounding Volumes Once**:
   - Cache computed bounding boxes and spheres
   - Only recompute when geometry changes

## Memory Management

```javascript
// Always dispose resources when done
geometry.dispose(); // Disposes all associated buffers
indexBuffer.dispose(); // Dispose individual buffers

// Clear buffer pool when application shuts down
pool.clear();
```

## Example Usage

Complete example showing a typical render pipeline setup:

```javascript
// Initialize WebGL
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Create geometry
const positions = new Float32Array([...]);
const normals = new Float32Array([...]);
const indices = new Uint16Array([...]);

const geometry = AttributeUtils.createStandardGeometry(gl, positions, normals, new Float32Array([...]));
geometry.setIndex(indices);

// Setup render loop
function render() {
  // Update dynamic data if needed
  if (geometryNeedsUpdate) {
    geometry.getAttribute('position').buffer.updateSubData(newPositions, 0);
  }
  
  // Bind buffers and enable attributes
  const shaderProgram = ...; // Your shader program
  geometry.enableAttributes(shaderProgram);
  
  // Draw
  const indexBuffer = geometry.getIndexBuffer();
  indexBuffer.bind();
  
  const mode = WebGLRenderingContext.TRIANGLES;
  const count = geometry.getIndexCount();
  const type = indexBuffer.isUint32() ? WebGLRenderingContext.UNSIGNED_INT : WebGLRenderingContext.UNSIGNED_SHORT;
  const offset = 0;
  
  gl.drawElements(mode, count, type, offset);
  
  // Cleanup
  geometry.disableAttributes();
}

// Dispose on cleanup
window.addEventListener('beforeunload', () => {
  geometry.dispose();
});
```

## Testing

Run the included test suite to validate the system:

```javascript
import { runAllTests } from './BufferTest.js';

const success = runAllTests();
if (success) {
  console.log('All tests passed!');
}
```

## API Reference

See individual class documentation for complete API reference:

- [Buffer Class](#buffer-class)
- [BufferGeometry Class](#buffergeometry-class)
- [BufferPool Class](#bufferpool-class)
- [VertexAttribute Class](#vertexattribute-class)

## Browser Compatibility

This system requires:
- WebGL 1.0 or WebGL 2.0
- TypedArrays support
- Modern JavaScript (ES6+)

## License

MIT License - see main project license for details.