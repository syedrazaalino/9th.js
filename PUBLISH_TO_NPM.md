# Publishing 9th.js to NPM - Step by Step Guide

## Important: Run These Commands on Your Local Machine

Due to permission restrictions and the need for your NPM credentials, you'll need to publish from your local machine.

## Quick Publishing Steps

### Step 1: Download the Project
Download all the files from this workspace to your local machine.

### Step 2: Install Dependencies
Open terminal in the project folder and run:
```bash
npm install
```

### Step 3: Build the Package
```bash
npm run build
```
This creates the `dist/` folder with all necessary files.

### Step 4: Test the Package (Optional but Recommended)
```bash
# Create a test package
npm pack

# This creates ninth-js-1.0.0.tgz
# You can test install it with:
npm install ./ninth-js-1.0.0.tgz
```

### Step 5: Login to NPM
```bash
npm login
```
Enter your credentials:
- **Username**: digitalcloud.no
- **Password**: [your password]
- **Email**: [your email]

Verify login:
```bash
npm whoami
# Should display: digitalcloud.no
```

### Step 6: Publish to NPM
```bash
npm publish
```

That's it! Your package will be live on NPM.

### Step 7: Verify Publication
```bash
# Check package info
npm view ninth-js

# Try installing it
npm install ninth-js
```

## What Gets Published

Based on your `package.json` configuration, NPM will publish:
- `dist/` folder (all build outputs)
- `README.md`
- `LICENSE`
- `package.json`

Everything else (source files, tests, etc.) is excluded via `.npmignore`.

## After Publishing

Your package will be available at:
- **NPM**: https://www.npmjs.com/package/ninth-js
- **Unpkg CDN**: https://unpkg.com/ninth-js@latest/dist/ninth-js.umd.js
- **JSDelivr CDN**: https://cdn.jsdelivr.net/npm/ninth-js@latest/dist/ninth-js.umd.js

## Troubleshooting

### Package Name Already Taken
If "ninth-js" is already taken, you have two options:

**Option 1: Use a Scoped Package**
Update `package.json`:
```json
{
  "name": "@digitalcloud.no/ninth-js"
}
```
Then publish with:
```bash
npm publish --access public
```

**Option 2: Choose a Different Name**
Update `package.json`:
```json
{
  "name": "ninth-graphics"
}
```

### Build Fails
Ensure all dev dependencies are installed:
```bash
npm install --save-dev rollup @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-terser
```

### Authentication Fails
Make sure you're using the correct credentials and your account is verified.

### Permission Denied
If you get EACCES errors:
```bash
# On Mac/Linux
sudo npm publish

# Or fix permissions
sudo chown -R $USER /usr/local/lib/node_modules
```

## Updating the Package

When you need to publish updates:

```bash
# Update version
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# Rebuild and publish
npm run build
npm publish
```

## Package Statistics

After publishing, you can track:
- Downloads at: https://www.npmjs.com/package/ninth-js
- Package health
- Version history
- Dependent packages

Your library will be globally available to all developers!
