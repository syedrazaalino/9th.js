# 9th.js Examples

This folder contains various examples showing how to use 9th.js in different scenarios.

## Available Examples

### 1. Simple HTML Example (`simple-html-example.html`)

A complete, standalone HTML file that demonstrates:
- ✅ **No build tools required** - just open in a browser
- ✅ **No npm install needed** - loads from CDN
- ✅ **Interactive UI controls** - sliders, color picker, buttons
- ✅ **Responsive design** - works on all screen sizes
- ✅ **Pure 9th.js** - no Three.js or other dependencies

**How to use:**
1. Download the file
2. Open it in your browser (double-click)
3. That's it! No server needed.

**Features:**
- Rotation speed control slider
- Cube size adjustment
- Camera distance control
- Color picker for cube
- Reset button
- Responsive canvas

## Using 9th.js in Your HTML

### Method 1: CDN (Recommended for Simple Sites)

```html
<!DOCTYPE html>
<html>
<head>
    <title>My 9th.js Project</title>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <!-- Load 9th.js from CDN -->
    <script src="https://unpkg.com/9th.js@latest/dist/umd/9th.umd.js"></script>
    
    <script>
        // Access from global namespace
        const { WebGLRenderer, Scene, PerspectiveCamera } = window.ninthjs;
        
        const canvas = document.getElementById('canvas');
        const renderer = new WebGLRenderer(canvas);
        const scene = new Scene();
        const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Your code here...
    </script>
</body>
</html>
```

### Method 2: ES6 Modules (Requires Build Tool or Server)

```html
<!DOCTYPE html>
<html>
<body>
    <canvas id="canvas"></canvas>
    
    <script type="module">
        import { WebGLRenderer, Scene, PerspectiveCamera } from 'https://unpkg.com/9th.js@latest/dist/esm/main.js';
        
        // Your code here...
    </script>
</body>
</html>
```

### Method 3: Local File (Download and Include)

1. Download `9th.umd.js` from the [latest release](https://unpkg.com/9th.js@latest/dist/umd/9th.umd.js)
2. Save it in your project folder
3. Include it:

```html
<script src="./9th.umd.js"></script>
<script>
    const { WebGLRenderer, Scene } = window.ninthjs;
    // Your code here...
</script>
```

## Common Use Cases

### Adding 3D to Existing Websites

```html
<!-- Add this to any existing HTML page -->
<div id="3d-container" style="width: 800px; height: 600px;">
    <canvas id="my-canvas"></canvas>
</div>

<script src="https://unpkg.com/9th.js@latest/dist/umd/9th.umd.js"></script>
<script>
    const { WebGLRenderer, Scene, PerspectiveCamera, BoxGeometry, MeshBasicMaterial, Mesh } = window.ninthjs;
    
    const canvas = document.getElementById('my-canvas');
    const renderer = new WebGLRenderer(canvas);
    renderer.setSize(800, 600);
    
    const scene = new Scene();
    const camera = new PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.z = 5;
    
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry, material);
    scene.add(cube);
    
    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    
    animate();
</script>
```

### Interactive Product Viewer

Perfect for e-commerce sites to show 3D product models:

```html
<div class="product-viewer">
    <canvas id="product-canvas"></canvas>
    <button onclick="rotateProduct()">Rotate</button>
    <button onclick="zoomIn()">Zoom In</button>
</div>
```

### Background Effects

Add stunning 3D backgrounds to your landing pages:

```html
<div class="hero-section" style="position: relative;">
    <canvas id="bg-canvas" style="position: absolute; top: 0; left: 0; z-index: -1;"></canvas>
    <h1>Your Content Here</h1>
</div>
```

## Browser Compatibility

9th.js works in all modern browsers that support WebGL:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

1. **Use appropriate canvas size** - don't make it bigger than needed
2. **Limit object count** - start with fewer objects and optimize
3. **Use requestAnimationFrame** - for smooth 60fps animations
4. **Dispose resources** - clean up when done to free memory

## Need Help?

- 📧 Email: hei@digitalcloud.no
- 🌐 Website: https://digitalcloud.no
- 📦 npm: https://www.npmjs.com/package/9th.js
- 📖 Documentation: https://digitalcloud.no/docs

## License

MIT License - Free to use in personal and commercial projects!
