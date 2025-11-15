/**
 * 9th.js Examples Index
 * Central export point for all 9th.js examples and demos
 */

// Basic Examples
export { default as basicHelloWorld } from './basic/01-hello-world.js';
export { default as basicAnimationLighting } from './basic/02-animation-lighting.js';

// Intermediate Examples
export { default as intermediateModelLoading } from './intermediate/01-model-loading.js';

// Advanced Examples
export { default as advancedPerformanceMonitoring } from './advanced/01-performance-monitoring.js';

// Integration Examples
export { 
    useNinthScene, 
    BasicScene, 
    AdvancedScene 
} from './integration/react-integration.js';

// Module Examples
export {
    coreModuleExample,
    cameraControlsExample,
    geometryMaterialsExample,
    loadingExample,
    particleExample,
    physicsExample,
    runModuleExamples
} from './modules/module-examples.js';

// Example runner utilities
export class ExampleRunner {
    constructor() {
        this.examples = new Map();
        this.activeExamples = new Set();
    }
    
    register(name, exampleFn) {
        this.examples.set(name, exampleFn);
    }
    
    run(name, options = {}) {
        if (!this.examples.has(name)) {
            throw new Error(`Example "${name}" not found`);
        }
        
        const exampleFn = this.examples.get(name);
        
        try {
            const result = exampleFn(options);
            this.activeExamples.add(name);
            return result;
        } catch (error) {
            console.error(`Failed to run example "${name}":`, error);
            throw error;
        }
    }
    
    runAll(options = {}) {
        const results = {};
        
        for (const [name, exampleFn] of this.examples) {
            try {
                results[name] = exampleFn(options);
                this.activeExamples.add(name);
            } catch (error) {
                console.error(`Failed to run example "${name}":`, error);
                results[name] = { error: error.message };
            }
        }
        
        return results;
    }
    
    stop(name) {
        if (this.activeExamples.has(name)) {
            this.activeExamples.delete(name);
            // Implement cleanup logic here
        }
    }
    
    stopAll() {
        this.activeExamples.clear();
        // Implement global cleanup logic here
    }
    
    listExamples() {
        return Array.from(this.examples.keys());
    }
    
    getExampleInfo(name) {
        const exampleFn = this.examples.get(name);
        if (!exampleFn) {
            return null;
        }
        
        // Extract example metadata if available
        return {
            name,
            description: exampleFn.description || 'No description available',
            category: this.categorizeExample(name),
            complexity: this.getComplexity(name)
        };
    }
    
    categorizeExample(name) {
        const categories = {
            basic: ['basic-hello-world', 'basic-animation-lighting'],
            intermediate: ['intermediate-model-loading'],
            advanced: ['advanced-performance-monitoring'],
            integration: ['react-integration'],
            modules: ['core-module', 'camera-controls', 'geometry-materials', 'loading', 'particles', 'physics']
        };
        
        for (const [category, examples] of Object.entries(categories)) {
            if (examples.some(example => name.includes(example))) {
                return category;
            }
        }
        
        return 'unknown';
    }
    
    getComplexity(name) {
        if (name.includes('basic')) return 'beginner';
        if (name.includes('intermediate')) return 'intermediate';
        if (name.includes('advanced')) return 'advanced';
        return 'unknown';
    }
}

// Example browser and HTML generator
export class ExampleBrowser {
    constructor(runner) {
        this.runner = runner;
        this.container = null;
    }
    
    createBrowser(containerId = 'examples-browser') {
        const container = document.getElementById(containerId) || this.createContainer(containerId);
        this.container = container;
        
        this.renderSidebar();
        this.renderContent();
        
        return container;
    }
    
    createContainer(id) {
        const container = document.createElement('div');
        container.id = id;
        container.style.cssText = `
            display: flex;
            height: 100vh;
            font-family: Arial, sans-serif;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    renderSidebar() {
        const sidebar = document.createElement('div');
        sidebar.style.cssText = `
            width: 250px;
            background: #f5f5f5;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid #ddd;
        `;
        
        sidebar.innerHTML = `
            <h3>9th.js Examples</h3>
            <div id="examples-list"></div>
        `;
        
        this.container.appendChild(sidebar);
        this.renderExamplesList();
    }
    
    renderExamplesList() {
        const listContainer = document.getElementById('examples-list');
        const examples = this.runner.listExamples();
        
        listContainer.innerHTML = examples.map(name => {
            const info = this.runner.getExampleInfo(name);
            const categoryClass = info?.category || 'unknown';
            
            return `
                <div class="example-item" data-example="${name}" style="
                    margin: 5px 0;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    cursor: pointer;
                    background: white;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='white'">
                    <div style="font-weight: bold; text-transform: capitalize;">
                        ${name.replace(/[-_]/g, ' ')}
                    </div>
                    <div style="font-size: 12px; color: #666; text-transform: capitalize;">
                        ${categoryClass} • ${info?.complexity || 'unknown'}
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        listContainer.querySelectorAll('.example-item').forEach(item => {
            item.addEventListener('click', () => {
                const exampleName = item.dataset.example;
                this.runExample(exampleName);
            });
        });
    }
    
    renderContent() {
        const content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: white;
        `;
        
        content.innerHTML = `
            <div id="example-content">
                <h2>Welcome to 9th.js Examples</h2>
                <p>Select an example from the sidebar to get started.</p>
                <p>These examples demonstrate various features and capabilities of the 9th.js library.</p>
            </div>
        `;
        
        this.container.appendChild(content);
    }
    
    runExample(name) {
        const content = document.getElementById('example-content');
        
        // Clear previous content
        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <h2>${name.replace(/[-_]/g, ' ')}</h2>
                <button onclick="exampleBrowser.stopExample()" style="
                    padding: 8px 16px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Stop Example</button>
            </div>
            <div id="example-canvas-container"></div>
        `;
        
        // Add canvas container
        const canvasContainer = document.getElementById('example-canvas-container');
        canvasContainer.innerHTML = `
            <canvas id="example-canvas" width="800" height="600" style="
                width: 100%;
                max-width: 800px;
                height: 400px;
                border: 1px solid #ddd;
                border-radius: 4px;
            ></canvas>
        `;
        
        // Add canvas element to DOM
        const canvas = document.getElementById('example-canvas');
        if (!canvas.parentNode.contains(canvas)) {
            canvasContainer.appendChild(canvas);
        }
        
        // Run the example
        try {
            const result = this.runner.run(name, { canvasId: 'example-canvas' });
            console.log(`Example "${name}" started:`, result);
        } catch (error) {
            content.innerHTML += `
                <div style="color: #dc3545; margin-top: 20px;">
                    Error running example: ${error.message}
                </div>
            `;
        }
    }
    
    stopExample() {
        this.runner.stopAll();
        const content = document.getElementById('example-content');
        content.innerHTML = `
            <h2>Example Stopped</h2>
            <p>Select another example from the sidebar to continue.</p>
        `;
    }
}

// Initialize global instances
const exampleRunner = new ExampleRunner();
const exampleBrowser = new ExampleBrowser(exampleRunner);

// Auto-register all examples
exampleRunner.register('basic-hello-world', coreModuleExample);
exampleRunner.register('basic-animation-lighting', basicAnimationLighting);
exampleRunner.register('intermediate-model-loading', intermediateModelLoading);
exampleRunner.register('advanced-performance-monitoring', advancedPerformanceMonitoring);

// Make instances globally available
if (typeof window !== 'undefined') {
    window.exampleRunner = exampleRunner;
    window.exampleBrowser = exampleBrowser;
}

// Default export with common usage patterns
export default {
    // All examples
    examples: exampleRunner,
    
    // Quick access to basic examples
    basic: {
        helloWorld: coreModuleExample,
        animationLighting: basicAnimationLighting
    },
    
    // Quick access to intermediate examples
    intermediate: {
        modelLoading: intermediateModelLoading
    },
    
    // Quick access to advanced examples
    advanced: {
        performanceMonitoring: advancedPerformanceMonitoring
    },
    
    // React integration
    react: {
        useNinthScene,
        BasicScene,
        AdvancedScene
    },
    
    // Module-specific examples
    modules: {
        core: coreModuleExample,
        cameras: cameraControlsExample,
        geometry: geometryMaterialsExample,
        loading: loadingExample,
        particles: particleExample,
        physics: physicsExample
    },
    
    // Utility classes
    utils: {
        ExampleRunner,
        ExampleBrowser
    }
};

// Also export as CommonJS for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        examples: exampleRunner,
        basic: {
            helloWorld: coreModuleExample,
            animationLighting: basicAnimationLighting
        },
        intermediate: {
            modelLoading: intermediateModelLoading
        },
        advanced: {
            performanceMonitoring: advancedPerformanceMonitoring
        },
        react: {
            useNinthScene,
            BasicScene,
            AdvancedScene
        },
        modules: {
            core: coreModuleExample,
            cameras: cameraControlsExample,
            geometry: geometryMaterialsExample,
            loading: loadingExample,
            particles: particleExample,
            physics: physicsExample
        },
        utils: {
            ExampleRunner,
            ExampleBrowser
        },
        default: exampleRunner
    };
}