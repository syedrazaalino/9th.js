#!/bin/bash

# 9th.js NPM Publishing Script
# Run this script from your local machine after downloading the project

set -e  # Exit on any error

echo "========================================="
echo "9th.js NPM Publishing Script"
echo "========================================="
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    echo "Please install Node.js and npm first"
    exit 1
fi

echo "✓ npm is installed"
echo ""

# Check if logged in to npm
if ! npm whoami &> /dev/null; then
    echo "⚠️  You are not logged in to NPM"
    echo "Please login with your credentials:"
    echo "Username: digitalcloud.no"
    echo ""
    npm login
    echo ""
fi

NPM_USER=$(npm whoami)
echo "✓ Logged in as: $NPM_USER"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✓ Dependencies installed"
echo ""

# Build the package
echo "🔨 Building package..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist folder not created"
    exit 1
fi

echo "✓ Build completed successfully"
echo ""

# Show package info
echo "📋 Package Information:"
echo "   Name: $(node -p "require('./package.json').name")"
echo "   Version: $(node -p "require('./package.json').version")"
echo "   Description: $(node -p "require('./package.json').description")"
echo ""

# Create test package
echo "🧪 Creating test package..."
npm pack
echo "✓ Test package created"
echo ""

# Ask for confirmation
read -p "Ready to publish to NPM? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publishing cancelled"
    exit 0
fi

# Publish to NPM
echo "🚀 Publishing to NPM..."
npm publish

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ Successfully published to NPM!"
    echo "========================================="
    echo ""
    echo "Your package is now available at:"
    echo "📦 https://www.npmjs.com/package/ninth-js"
    echo "🌐 https://unpkg.com/ninth-js@latest/dist/ninth-js.umd.js"
    echo ""
    echo "Install with:"
    echo "npm install ninth-js"
    echo ""
else
    echo ""
    echo "❌ Publishing failed"
    echo "Please check the error message above"
    exit 1
fi
