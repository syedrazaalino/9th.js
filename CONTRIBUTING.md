# Contributing to Ninth.js

Thank you for your interest in contributing to Ninth.js! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/9th.js.git
   cd 9th.js
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and write tests

3. Run the test suite:
   ```bash
   npm test
   ```

4. Run linting:
   ```bash
   npm run lint
   ```

5. Build the library:
   ```bash
   npm run build
   ```

6. Commit your changes with a descriptive message:
   ```bash
   git commit -m "Add feature: description of your changes"
   ```

7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

8. Create a Pull Request on GitHub

## Code Style

- Use TypeScript for all new code
- Follow the existing code style (ESLint will catch most issues)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write tests for new features

## Code Guidelines

### TypeScript
- Use strict TypeScript settings
- Avoid `any` type when possible
- Use interfaces for object shapes
- Use enums for constants

### Naming Conventions
- Classes: PascalCase (`PerspectiveCamera`)
- Functions and variables: camelCase (`createMesh`)
- Constants: UPPER_SNAKE_CASE (`MAX_TEXTURE_SIZE`)
- Private members: prefix with underscore (`_internalMethod`)

### File Organization
- One class per file
- Group related functionality in modules
- Use index files for module exports
- Keep files under reasonable line limits (200-300 lines)

## Testing

- Write unit tests for all new features
- Use Jest for testing
- Mock WebGL and DOM APIs as needed
- Test both success and error cases
- Maintain test coverage above 80%

### Running Tests
```bash
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
```

## Documentation

- Update documentation for any API changes
- Use JSDoc for inline documentation
- Update README.md for significant changes
- Add examples for new features

### Building Documentation
```bash
npm run docs
```

## Pull Request Guidelines

### Before Submitting
- [ ] Code follows the project's style guidelines
- [ ] All tests pass
- [ ] New code has tests
- [ ] Documentation is updated
- [ ] Commit messages are clear and descriptive

### Pull Request Description
Include:
- Brief description of changes
- Related issue numbers (if applicable)
- Testing instructions
- Screenshots for UI changes (if applicable)

### Review Process
1. Automated checks must pass
2. At least one maintainer review required
3. Address all review comments
4. Re-request review after changes

## Bug Reports

When reporting bugs, include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Minimal reproduction case

## Feature Requests

For new features:
- Check if the feature already exists
- Search existing issues and PRs
- Describe the use case
- Explain how it fits the library's goals
- Consider backward compatibility

## Getting Help

- Check the [documentation](docs/API.md)
- Search existing [issues](https://github.com/username/9th.js/issues)
- Join our community discussions
- Contact maintainers

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor highlights

## Code of Conduct

We expect all contributors to:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect different viewpoints and experiences

Thank you for contributing to Ninth.js!