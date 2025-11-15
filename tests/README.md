# 9th.js Testing Suite

This document describes the comprehensive automated testing suite for the 9th.js 3D graphics library.

## Overview

The testing suite is designed to ensure reliability, performance, and visual correctness of the 9th.js library across different environments and browsers. It consists of several types of tests:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **Performance Tests**: Measure and monitor performance characteristics
- **Visual Regression Tests**: Ensure rendering output consistency
- **Load Tests**: Test library with real-world scenarios
- **Browser Tests**: Test cross-browser compatibility

## Directory Structure

```
tests/
├── unit/              # Unit tests for individual classes and modules
│   ├── core/          # Core library components (Geometry, Material, Scene, etc.)
│   ├── geometry/      # Geometry classes (BoxGeometry, SphereGeometry, etc.)
│   ├── materials/     # Material classes (MeshBasicMaterial, etc.)
│   ├── lights/        # Lighting system tests
│   ├── cameras/       # Camera class tests
│   ├── loaders/       # File loader tests
│   └── ...
├── integration/       # Integration tests for complete workflows
│   ├── rendering-pipeline.test.ts    # Complete rendering pipeline
│   ├── animation-system.test.ts      # Animation system integration
│   ├── lighting-integration.test.ts  # Lighting system integration
│   └── ...
├── performance/       # Performance and benchmarking tests
│   ├── webgl-performance.test.ts     # WebGL operation performance
│   ├── memory-usage.test.ts          # Memory usage tests
│   ├── rendering-performance.test.ts # Rendering performance
│   └── ...
├── visual/            # Visual regression tests
│   ├── visual-regression.test.ts     # Visual output consistency
│   ├── material-visual.test.ts       # Material rendering tests
│   └── ...
├── load/              # Load tests for real-world scenarios
│   ├── load-tests.test.ts            # Example file loading tests
│   ├── stress-tests.test.ts          # Stress testing
│   └── ...
└── browser/           # Browser-specific tests
    ├── browser-compatibility.test.ts # Cross-browser tests
    ├── webgl-context.test.ts         # WebGL context tests
    └── ...
```

## Test Types

### Unit Tests (`tests/unit/`)

Unit tests focus on testing individual components in isolation:

- **Core Classes**: BufferGeometry, Material, Scene, WebGLRenderer
- **Geometry Classes**: BoxGeometry, SphereGeometry, PlaneGeometry
- **Materials**: MeshBasicMaterial, MeshStandardMaterial, MeshPhongMaterial
- **Lights**: AmbientLight, DirectionalLight, PointLight
- **Cameras**: PerspectiveCamera, OrthographicCamera
- **Animation**: AnimationClip, AnimationMixer, KeyframeTrack
- **Loaders**: GLTFLoader, OBJLoader, TextureLoader

#### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run specific unit test
npm run test -- tests/unit/core/BufferGeometry.test.ts

# Run unit tests with coverage
npm run test:unit -- --coverage
```

### Integration Tests (`tests/integration/`)

Integration tests verify that different components work together correctly:

- **Rendering Pipeline**: Complete scene rendering workflow
- **Animation System**: Animation with rendering
- **Lighting Integration**: Light-material-geometry interactions
- **Material System**: Multiple material types working together
- **Loader Integration**: File loading with rendering

#### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm run test -- tests/integration/rendering-pipeline.test.ts
```

### Performance Tests (`tests/performance/`)

Performance tests measure and monitor performance characteristics:

- **WebGL Operations**: Buffer creation, shader compilation, texture operations
- **Memory Usage**: GPU memory management, allocation/deallocation
- **Rendering Performance**: Frame rates, draw call efficiency
- **Geometry Performance**: Complex geometry creation and updates
- **Material Performance**: Shader compilation and property updates

#### Running Performance Tests

```bash
# Run all performance tests (increases timeout to 60 seconds)
npm run test:performance

# Run specific performance test
npm run test -- tests/performance/webgl-performance.test.ts
```

### Visual Regression Tests (`tests/visual/`)

Visual tests ensure rendering output consistency:

- **Material Rendering**: Different material types and properties
- **Lighting Effects**: Various lighting configurations
- **Geometry Rendering**: Different geometry types and transformations
- **Animation Rendering**: Animated scenes and transformations
- **Background Rendering**: Different background types and effects

#### Running Visual Tests

```bash
# Run all visual tests (increases timeout to 120 seconds)
npm run test:visual

# Run specific visual test
npm run test -- tests/visual/visual-regression.test.ts
```

### Load Tests (`tests/load/`)

Load tests simulate real-world usage scenarios:

- **Example Files**: Loading and rendering library examples
- **Stress Testing**: Large numbers of objects and complex scenes
- **Memory Stress**: Memory-intensive operations
- **Browser Compatibility**: Different browser environments

#### Running Load Tests

```bash
# Run all load tests (increases timeout to 300 seconds)
npm run test:load

# Run specific load test
npm run test -- tests/load/load-tests.test.ts
```

### Browser Tests (`tests/browser/`)

Browser-specific tests for cross-browser compatibility:

- **WebGL Context**: Different WebGL implementations
- **Feature Detection**: Browser-specific feature support
- **Performance**: Browser-specific performance characteristics
- **Compatibility**: Cross-browser API differences

#### Running Browser Tests

```bash
# Requires Playwright to be installed
npm run test:browser

# Install Playwright browsers
npx playwright install --with-deps
```

## Configuration

### Jest Configuration

The testing suite uses Jest with different configurations for different test types:

- **Default Config** (`jest.config.js`): Core unit and integration tests
- **Browser Config** (`jest.browser.config.js`): Browser-specific tests

### WebGL Mocking

Comprehensive WebGL context mocking is provided in `jest.setup.ts`:

```typescript
// Mock WebGL context with all necessary methods and constants
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn().mockImplementation((contextType) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return mockWebGLContext; // Complete WebGL mock
    }
    return null;
  })
});
```

### Browser Environment

Browser tests use JSDOM with additional WebGL and Canvas mocks:

```typescript
// Setup browser environment
const dom = new JSDOM(`<!DOCTYPE html><html><body><canvas></canvas></body></html>`);
global.window = dom.window;
global.document = dom.window.document;
```

## CI/CD Integration

### GitHub Actions

Comprehensive GitHub Actions workflow (`.github/workflows/test.yml`):

- **Multi-platform testing**: Linux, Windows, macOS
- **Multi-version Node.js**: 16, 18, 20
- **Test stages**: Lint, Unit, Integration, Performance, Visual, Load
- **Security audit**: Dependency vulnerability scanning
- **Bundle analysis**: Size limit verification
- **Documentation**: API documentation generation

### Travis CI

Travis CI configuration (`.travis.yml`) with:

- **Build matrix**: Multiple platforms and Node versions
- **Staged builds**: Sequential and parallel test execution
- **Deploy automation**: Documentation and release automation
- **Notification integration**: Slack and email notifications

## Test Scripts

### Package.json Scripts

```bash
# Basic test commands
npm test                    # Run all tests with default config
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage reporting
npm run test:ci            # CI-optimized test run

# Specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:performance   # Performance tests only
npm run test:visual        # Visual regression tests only
npm run test:load          # Load tests only
npm run test:browser       # Browser compatibility tests

# Combined test runs
npm run test:all          # Run all test types sequentially
npm run validate          # Type check + lint + test
```

### Individual Test Commands

```bash
# Run specific test files
npm run test -- tests/unit/core/BufferGeometry.test.ts
npm run test -- tests/integration/rendering-pipeline.test.ts

# Run tests with specific patterns
npm run test -- --testNamePattern="should create"
npm run test -- --testPathPattern="geometry"

# Run tests with specific options
npm run test -- --verbose
npm run test -- --bail
npm run test -- --maxWorkers=4
```

## Coverage Reporting

### Coverage Thresholds

Configured coverage thresholds in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML Report**: `coverage/index.html`
- **LCov Report**: `coverage/lcov.info`
- **Text Report**: Console output
- **Codecov Integration**: Automated upload

### Coverage Targets

- **Core Library**: 90%+ coverage
- **Utils/Helpers**: 80%+ coverage
- **Edge Cases**: 70%+ coverage
- **Integration Points**: 85%+ coverage

## Performance Monitoring

### Performance Metrics

Performance tests measure:

- **Execution Time**: Operation completion times
- **Memory Usage**: Heap and GPU memory consumption
- **Frame Rates**: Rendering performance
- **Throughput**: Operations per second
- **Scalability**: Performance with increasing load

### Benchmarking

```javascript
it('should create buffers efficiently', () => {
  const startTime = performance.now();
  
  // Create many buffers
  for (let i = 0; i < 100; i++) {
    const buffer = renderer.createBuffer({ data: testData });
  }
  
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(100); // < 100ms
});
```

### Performance Regression Detection

- **Baseline Comparison**: Compare against known good performance
- **Trend Monitoring**: Track performance over time
- **Regression Alerts**: Automatic failure on significant regressions

## Visual Testing

### Visual Regression Testing

Visual tests ensure rendering output consistency:

- **Reference Images**: Baseline images for comparison
- **Pixel Comparison**: Automated pixel-by-pixel comparison
- **Tolerance Levels**: Configurable tolerance for acceptable differences
- **Context Awareness**: Account for platform differences

### Visual Test Setup

```typescript
it('should render cube correctly', () => {
  const canvas = createTestCanvas(400, 300);
  const renderer = new WebGLRenderer({ canvas });
  const scene = new Scene();
  const camera = new PerspectiveCamera();
  
  // Setup scene
  const geometry = new BoxGeometry();
  const material = new MeshBasicMaterial({ color: 0xff0000 });
  const cube = new Mesh(geometry, material);
  scene.add(cube);
  
  // Render and compare
  renderer.render(scene, camera);
  const pixels = captureCanvasPixels(canvas);
  
  // Compare against baseline (implementation depends on setup)
  expect(pixels).toMatchVisualBaseline('red-cube');
});
```

## Best Practices

### Test Organization

- **Descriptive Names**: Clear, descriptive test and describe block names
- **Arrange-Act-Assert**: Clear test structure
- **Single Responsibility**: Each test should test one thing
- **Independent Tests**: Tests should not depend on each other

### Mocking Strategy

- **WebGL Context**: Comprehensive WebGL mocking for unit tests
- **DOM Elements**: Mock DOM APIs for browser compatibility
- **External Dependencies**: Mock network requests and file I/O
- **Time-dependent Code**: Mock timing functions and animation frames

### Performance Considerations

- **Test Isolation**: Each test should clean up after itself
- **Resource Management**: Properly dispose of WebGL resources
- **Memory Leaks**: Monitor for memory leaks in test runs
- **Test Speed**: Optimize tests for reasonable execution time

### Continuous Integration

- **Fast Feedback**: Quick feedback for developers
- **Parallel Execution**: Run tests in parallel where possible
- **Smart Filtering**: Run relevant tests based on code changes
- **Failure Analysis**: Detailed failure information and logs

## Troubleshooting

### Common Issues

1. **WebGL Context Not Available**
   - Ensure WebGL mocking is properly configured
   - Check that canvas element is available in test environment

2. **Performance Test Timeouts**
   - Increase timeout for performance tests
   - Reduce test data size for faster execution

3. **Visual Test Failures**
   - Check baseline images are up to date
   - Verify platform-specific differences are accounted for
   - Increase tolerance for acceptable differences

4. **Browser Test Failures**
   - Ensure Playwright browsers are installed
   - Check for browser-specific API differences
   - Verify JSDOM environment is properly configured

### Debug Mode

```bash
# Run tests in debug mode
npm run test:unit -- --verbose --no-coverage

# Run specific failing test
npm run test:unit -- tests/unit/core/BufferGeometry.test.ts --verbose

# Run tests with additional debugging
npm run test:unit -- --detectOpenHandles --forceExit
```

## Contributing

### Adding New Tests

1. **Choose the Right Test Type**: Unit, integration, performance, visual, or load
2. **Follow Naming Conventions**: Descriptive test and file names
3. **Use Appropriate Mocks**: Mock external dependencies appropriately
4. **Ensure Test Independence**: Tests should not depend on each other
5. **Add Documentation**: Document complex test scenarios

### Test Code Style

- Use TypeScript for all test files
- Follow existing code style and formatting
- Use descriptive test names
- Include inline comments for complex logic
- Mock external dependencies appropriately

### Review Process

- All tests must pass before merging
- Code review for test quality and coverage
- Performance impact assessment for new tests
- Cross-browser compatibility verification

## Maintenance

### Regular Maintenance

- **Update Baselines**: Regular updates to visual regression baselines
- **Performance Monitoring**: Track and address performance regressions
- **Dependency Updates**: Keep testing dependencies up to date
- **Test Coverage**: Monitor and improve code coverage

### Continuous Improvement

- **Analyze Failures**: Understand why tests fail and improve robustness
- **Optimize Performance**: Continuously improve test execution speed
- **Enhance Coverage**: Add tests for edge cases and error conditions
- **Tool Updates**: Stay current with testing tools and best practices

This comprehensive testing suite ensures the reliability, performance, and visual correctness of the 9th.js library across all supported environments and use cases.
