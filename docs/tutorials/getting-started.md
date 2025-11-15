# Getting Started with Ninth.js

Welcome to Ninth.js! This tutorial will help you set up your development environment and create your first 3D scene.

## What is Ninth.js?

Ninth.js is a lightweight, high-performance 3D JavaScript library designed for creating interactive graphics and visualizations on the web. Built on WebGL, it provides a simple yet powerful API for building 3D applications.

### Key Features
- **Modern WebGL-based rendering** for optimal performance
- **TypeScript support** with full type definitions
- **Modular architecture** - import only what you need
- **Built-in geometries, cameras, and lighting systems**
- **Material system** with basic and advanced materials

## Installation

### Option 1: NPM Installation
```bash
npm install ninth.js
```

Then import in your project:
```javascript
import { Engine, Scene, Renderer } from 'ninth.js';
```

### Option 2: CDN (Development)
Add this to your HTML file:
```html
<script src="https://unpkg.com/ninth.js@latest/dist/9th.umd.js"></script>
```

### Option 3: Local File
Download the library and include it locally:
```html
<script src="dist/9th.umd.js"></script>
```

## Your First Ninth.js Application

Let's create a simple "Hello World" 3D scene:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Ninth.js Scene</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #000;
        }
        canvas {
            display: block;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <script src="dist/9th.umd.js"></script>
    <script>
        // Get the canvas element
        const canvas = document.getElementById('canvas');
        
        // Initialize canvas size
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        try {
            // Create the engine
            const engine = new NinthJS.Engine(canvas, {
                antialias: true,
                alpha: false
            });
            
            // Create a scene
            const scene = new NinthJS.Scene();
            scene.setBackground('#222222');
            
            // Create a camera
            const camera = new NinthJS.PerspectiveCamera(
                75,                                    // FOV
                canvas.width / canvas.height,          // Aspect ratio
                0.1,                                   // Near plane
                1000                                   // Far plane
            );
            camera.setPosition(0, 0, 5);
            
            // Create a renderer
            const renderer = new NinthJS.Renderer(canvas);
            
            // Create a box geometry
            const geometry = new NinthJS.BoxGeometry(1, 1, 1);
            
            // Create a material
            const material = new NinthJS.BasicMaterial({ 
                color: '#4488ff' 
            });
            
            // Create a mesh (geometry + material)
            const cube = new NinthJS.Mesh(geometry);
            cube.material = material;
            
            // Add the cube to the scene
            scene.add(cube);
            
            // Add some lighting
            const ambientLight = new NinthJS.AmbientLight(0.3, '#ffffff');
            scene.add(ambientLight);
            
            const directionalLight = new NinthJS.DirectionalLight(1, '#ffffff');
            directionalLight.setDirection(-1, -1, -1);
            scene.add(directionalLight);
            
            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                
                // Rotate the cube
                cube.setRotation(0, performance.now() * 0.001, 0);
                
                // Render the scene
                renderer.render(scene, camera);
            }
            
            animate();
            
            console.log('🎉 Your first Ninth.js scene is running!');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to initialize Ninth.js: ' + error.message);
        }
    </script>
</body>
</html>
```

## Understanding the Code

Let's break down what we just created:

### 1. Engine Initialization
```javascript
const engine = new NinthJS.Engine(canvas, {
    antialias: true,  // Smooth edges
    alpha: false      // No transparency
});
```
The Engine class manages the entire application and handles WebGL context creation.

### 2. Scene Creation
```javascript
const scene = new NinthJS.Scene();
scene.setBackground('#222222');
```
The Scene acts as a container for all 3D objects.

### 3. Camera Setup
```javascript
const camera = new NinthJS.PerspectiveCamera(75, aspect, 0.1, 1000);
camera.setPosition(0, 0, 5);
```
The camera defines how we view the 3D world.

### 4. Geometry and Materials
```javascript
const geometry = new NinthJS.BoxGeometry(1, 1, 1);
const material = new NinthJS.BasicMaterial({ color: '#4488ff' });
```
Geometry defines shape, material defines appearance.

### 5. Lighting
```javascript
const light = new NinthJS.AmbientLight(0.3, '#ffffff');
scene.add(light);
```
Lights illuminate objects in the scene.

## Running Your Application

1. **Local Server**: Serve your HTML file through a local web server
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

2. **Open in Browser**: Navigate to `http://localhost:8000`

3. **View Your Scene**: You should see a rotating blue cube!

## Development Best Practices

### 1. Error Handling
Always wrap your Ninth.js code in try-catch blocks:
```javascript
try {
    // Ninth.js code here
} catch (error) {
    console.error('Ninth.js error:', error);
    // Handle gracefully
}
```

### 2. Responsive Design
Handle window resizing:
```javascript
function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
}

window.addEventListener('resize', handleResize);
```

### 3. Performance Monitoring
Monitor frame rate:
```javascript
let frameCount = 0;
let lastTime = performance.now();

function animate() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        console.log('FPS:', frameCount);
        frameCount = 0;
        lastTime = currentTime;
    }
    
    // ... render code
}
```

## Common Issues and Solutions

### WebGL Not Supported
```javascript
if (!canvas.getContext('webgl')) {
    alert('WebGL not supported in this browser');
    return;
}
```

### Canvas Sizing
Ensure your canvas fills the window and updates on resize:
```javascript
canvas.style.width = '100vw';
canvas.style.height = '100vh';
```

### Memory Management
Clean up resources when no longer needed:
```javascript
// Dispose of geometries and materials
geometry.dispose();
material.dispose();
```

## Next Steps

Congratulations! You've created your first Ninth.js application. Here are some recommended next steps:

1. **Try Different Geometries**: Experiment with `SphereGeometry`, `PlaneGeometry`
2. **Learn Materials**: Explore different material types in the [Materials tutorial](./working-with-materials.md)
3. **Add Animation**: Make your scene more dynamic in the [Animation Basics tutorial](./animation-basics.md)
4. **Build a Scene**: Create more complex scenes in the [First 3D Scene tutorial](./first-3d-scene.md)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Black screen | Check browser console for errors, ensure WebGL support |
| Performance issues | Reduce geometry complexity, use simpler materials |
| Incorrect lighting | Ensure lights are added to the scene and positioned correctly |
| Camera positioning | Adjust camera position and FOV to see your objects |

## Resources

- [API Reference](../API.md) - Complete API documentation
- [Examples](../../examples/) - More code examples
- [GitHub Repository](https://github.com/ninthjs/ninth.js) - Source code and issues

---

**Happy coding! Your journey into 3D graphics with Ninth.js has just begun! 🚀**