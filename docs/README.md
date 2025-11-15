# 9th.js Documentation System

This comprehensive documentation system provides complete API references, guides, examples, and interactive demos for the 9th.js 3D JavaScript library.

## Documentation Overview

The documentation is organized into several key sections:

```
docs/
├── api/                 # API Reference (TypeDoc generated)
│   ├── index.html       # Main API index with search
│   ├── README.md        # API documentation overview
│   ├── styles.css       # Comprehensive styling
│   └── examples.md      # Detailed API examples
├── guides/              # User Guides and Tutorials
│   ├── getting-started.md
│   ├── core-concepts.md
│   ├── rendering.md
│   ├── animation.md
│   ├── materials.md
│   └── lighting.md
└── examples/            # Interactive Examples
    ├── basic.html
    ├── advanced.html
    └── [various demos]
```

## Features

### 🔍 **Searchable Interface**
- Full-text search across all classes, methods, and properties
- Smart autocomplete with category filtering
- Real-time search results with highlighting

### 📱 **Responsive Design**
- Mobile-first responsive layout
- Optimized for tablets and phones
- Accessible on all screen sizes

### 🌙 **Dark Theme Support**
- Automatic dark/light theme detection
- High contrast mode support
- Print-friendly styles

### 🎨 **Modern UI**
- Clean, professional design
- Syntax-highlighted code blocks
- Interactive component examples
- Smooth animations and transitions

### 📖 **Comprehensive Content**
- Complete API reference for all 50+ classes
- In-depth guides covering all major topics
- Interactive examples and demos
- Performance optimization tips
- Best practices and patterns

## Quick Start

### Local Development

1. **Start the documentation server:**
```bash
# Using the provided script
./serve-docs.sh

# Or manually with Python
cd docs
python3 -m http.server 3000

# Or with Node.js
npx http-server docs -p 3000
```

2. **Open in browser:**
```
http://localhost:3000/api/index.html
```

### Build Documentation

Generate TypeDoc API documentation:

```bash
# Build all documentation
npm run docs:build-all

# Build API docs only
npm run docs:generate

# Watch for changes during development
npm run docs:dev
```

### Development Server with Live Reload

For active development, use a live reload server:

```bash
# Install live-server globally
npm install -g live-server

# Start with live reload
cd docs
live-server --port=3000 --entry-file=api/index.html
```

## Documentation Structure

### API Reference (`docs/api/`)

Generated from TypeScript source code using TypeDoc:

- **Complete class documentation** with all methods, properties, and events
- **Type signatures** and parameter descriptions
- **Code examples** for every major API
- **Interactive search** and navigation
- **Performance metrics** and optimization tips

### User Guides (`docs/guides/`)

Comprehensive tutorials and guides:

- **Getting Started** - Introduction and basic concepts
- **Core Concepts** - Architecture and fundamental ideas
- **Rendering Guide** - Advanced rendering techniques
- **Animation Guide** - Animation systems and techniques
- **Materials Guide** - Material systems and shader development
- **Lighting Guide** - Lighting systems and shadow mapping

### Examples (`docs/examples/`)

Interactive demonstrations:

- **Basic Demo** - Simple rotating cube
- **Advanced Demo** - Complex scene with multiple features
- **Component Examples** - Specific feature demonstrations

## API Documentation Standards

### Class Documentation

Every class follows this structure:

```typescript
/**
 * Class description explaining purpose and main features
 */
class ExampleClass {
  /**
   * Constructor description
   * @param param1 - Description of parameter
   * @param param2 - Description of parameter
   * @returns Description of return value
   */
  constructor(param1: Type1, param2: Type2): ExampleClass
  
  /**
   * Method description
   * @param param - Parameter description
   * @returns Return value description
   */
  public method(param: Type): ReturnType
  
  /**
   * Property description with type
   */
  public property: PropertyType
}
```

### Method Documentation

Each method includes:

- **Purpose and behavior description**
- **Parameter documentation** with types and descriptions
- **Return value documentation**
- **Usage examples** with realistic code
- **Error handling** and edge cases
- **Performance notes** where relevant

### Event Documentation

Events are documented with:

- **Event name and purpose**
- **Event data structure**
- **When the event is triggered**
- **Usage examples** with event handlers

## Customization

### Styling

The documentation uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #667eea;
  --text-primary: #2d3748;
  --background-primary: #ffffff;
  /* ... more custom properties */
}
```

### TypeDoc Configuration

The `typedoc.json` configuration controls:

- **Entry points** and file inclusion/exclusion
- **Output format** and structure
- **Plugin configuration**
- **Navigation and sidebar options**
- **Search and categorization**

### Content Organization

Documentation is organized by:

1. **Category-based navigation** (Core, Cameras, Geometry, etc.)
2. **Alphabetical sorting** within categories
3. **Related content cross-referencing**
4. **Progressive disclosure** (overview → details → examples)

## Search System

### Implementation

The search system includes:

- **Full-text search** across all documentation
- **Category filtering** (Classes, Methods, Properties)
- **Smart ranking** by relevance and frequency
- **Auto-complete** suggestions
- **Search result highlighting**

### Usage

Search supports:

- **Exact class names:** `Engine`, `Vector3`, `Material`
- **Partial matches:** `vec`, `anim`, `light`
- **Method names:** `setPosition`, `addChild`, `update`
- **Property access:** `.position`, `.rotation`, `.visible`
- **Concept searches:** `shadow`, `animation`, `PBR`

## Accessibility

### Standards Compliance

- **WCAG 2.1 AA compliant**
- **Keyboard navigation** support
- **Screen reader** compatible
- **High contrast** mode support
- **Reduced motion** preference support

### Implementation

- **Semantic HTML** structure
- **ARIA labels** and roles
- **Focus management** and indicators
- **Color contrast** ratios meeting standards
- **Text alternatives** for visual content

## Performance

### Optimization Features

- **Lazy loading** of documentation sections
- **Code splitting** by category
- **Image optimization** and compression
- **Minified CSS/JS** for production
- **CDN-ready** asset delivery

### Monitoring

Track documentation performance with:

```javascript
// Performance tracking
document.addEventListener('DOMContentLoaded', () => {
  console.log('Documentation loaded in', performance.now(), 'ms');
});

// Search performance
const searchMetrics = {
  queryTime: [],
  resultCount: []
};
```

## Contributing

### Content Updates

1. **Update source code** JSDoc comments
2. **Regenerate API docs** with TypeDoc
3. **Update guides** with new information
4. **Add examples** for new features
5. **Test locally** before committing

### Code Style

- **Clear, concise descriptions** (2-3 sentences max)
- **Consistent terminology** across documentation
- **Real-world examples** with practical code
- **Error handling** documentation
- **Performance notes** where relevant

### Review Process

1. **Technical accuracy** review
2. **Code example** validation
3. **Link verification**
4. **Accessibility** compliance check
5. **Performance** impact assessment

## Testing

### Documentation Testing

```bash
# Test documentation build
npm run docs:generate

# Validate links
npm run docs:validate

# Accessibility testing
npm run docs:accessibility

# Performance testing
npm run docs:performance
```

### Link Checking

```bash
# Check all internal links
npm run docs:check-links

# Validate external links
npm run docs:validate-external
```

## Deployment

### Build Process

1. **Generate API docs** from source
2. **Optimize assets** (images, CSS, JS)
3. **Validate links** and content
4. **Package for deployment**
5. **Deploy to hosting**

### Hosting Options

- **GitHub Pages** - Free hosting for open source
- **Netlify** - Automated builds and deployment
- **Vercel** - Fast global CDN
- **Self-hosted** - Custom server deployment

## Analytics

### Tracking

Monitor documentation usage with:

- **Page views** and unique visitors
- **Search queries** and popular content
- **Download statistics** for examples
- **User feedback** and ratings
- **Performance metrics**

### Implementation

```javascript
// Analytics tracking
if (typeof gtag !== 'undefined') {
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href
  });
}
```

## Support

### Getting Help

- **Documentation Issues** - Report on GitHub
- **API Questions** - Use GitHub Discussions
- **Examples** - Interactive demos available
- **Community** - Discord/Discord community

### Resources

- **API Reference** - Complete class documentation
- **Guides** - Step-by-step tutorials
- **Examples** - Working code demonstrations
- **FAQ** - Frequently asked questions

---

This documentation system provides a comprehensive, searchable, and accessible resource for all 9th.js developers, from beginners to advanced users. It combines automated API generation with hand-crafted guides and examples to deliver a complete learning and reference experience.