#!/bin/bash
# Enhanced Distribution Script for 9th.js
# This script handles the complete distribution process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_ROOT/dist"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    log_info "Validating environment..."
    
    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version)
        log_info "Node.js version: $NODE_VERSION"
        
        # Extract major version
        MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            log_error "Node.js version $NODE_VERSION is too old. Minimum required: v16.0.0"
            exit 1
        fi
    else
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm version
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        log_info "npm version: $NPM_VERSION"
    else
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        log_error "package.json not found"
        exit 1
    fi
    
    # Check if build script exists
    if [ ! -f "$PROJECT_ROOT/rollup.config.js" ]; then
        log_error "rollup.config.js not found"
        exit 1
    fi
    
    log_success "Environment validation completed"
}

# Function to install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
        npm install
    else
        log_info "Dependencies already installed, running npm ci..."
        npm ci
    fi
    
    log_success "Dependencies installed"
}

# Function to run pre-build validation
validate_source() {
    log_info "Validating source code..."
    
    # Type checking
    log_info "Running TypeScript type check..."
    npm run type-check || {
        log_error "TypeScript type check failed"
        exit 1
    }
    
    # Linting
    log_info "Running ESLint..."
    npm run lint || {
        log_error "ESLint failed"
        exit 1
    }
    
    # Running tests
    log_info "Running tests..."
    npm test || {
        log_error "Tests failed"
        exit 1
    }
    
    log_success "Source validation completed"
}

# Function to build distribution
build_distribution() {
    log_info "Building distribution..."
    
    # Clean existing dist
    npm run clean
    
    # Build all targets
    npm run build || {
        log_error "Build failed"
        exit 1
    }
    
    # Verify build output
    if [ ! -d "$DIST_DIR" ]; then
        log_error "Distribution directory not created"
        exit 1
    fi
    
    # Check file sizes
    log_info "Checking build output..."
    npm run analyze || {
        log_warning "Build analysis failed, but continuing..."
    }
    
    log_success "Distribution build completed"
}

# Function to validate distribution
validate_distribution() {
    log_info "Validating distribution..."
    
    # Run custom validation scripts
    npm run validate-dist || {
        log_error "Distribution validation failed"
        exit 1
    }
    
    npm run verify-exports || {
        log_error "Export validation failed"
        exit 1
    }
    
    log_success "Distribution validation completed"
}

# Function to create distribution package
create_package() {
    log_info "Creating distribution package..."
    
    # Check package.json integrity
    if ! npm run verify-exports > /dev/null 2>&1; then
        log_warning "Package exports validation has warnings"
    fi
    
    # Create tarball for testing
    npm pack || {
        log_error "Failed to create package tarball"
        exit 1
    }
    
    # Test package extraction
    local package_name=$(node -p "require('./package.json').name")
    local package_version=$(node -p "require('./package.json').version")
    local tarball="${package_name}-${package_version}.tgz"
    
    if [ -f "$tarball" ]; then
        log_info "Package tarball created: $tarball"
        
        # Test package in a temporary directory
        local temp_dir=$(mktemp -d)
        cd "$temp_dir"
        
        log_info "Testing package installation in temporary directory..."
        npm install "../$PROJECT_ROOT/$tarball" || {
            log_error "Package installation test failed"
            cd "$PROJECT_ROOT"
            rm -rf "$temp_dir"
            exit 1
        }
        
        # Clean up temp directory
        cd "$PROJECT_ROOT"
        rm -rf "$temp_dir"
        
        log_success "Package testing completed"
    fi
    
    log_success "Distribution package created"
}

# Function to publish to npm (optional)
publish_package() {
    local tag=${1:-"latest"}
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would publish to npm with tag '$tag'"
        return 0
    fi
    
    log_info "Publishing to npm with tag '$tag'..."
    
    # Check if user is logged in
    if ! npm whoami > /dev/null 2>&1; then
        log_error "You are not logged in to npm. Run 'npm login' first."
        exit 1
    fi
    
    # Publish with tag
    npm publish --tag "$tag" || {
        log_error "Failed to publish package"
        exit 1
    }
    
    log_success "Package published to npm"
}

# Function to create GitHub release
create_github_release() {
    local tag=$1
    local release_name=$2
    local notes=$3
    
    if command_exists gh; then
        log_info "Creating GitHub release..."
        
        # Create release notes file temporarily
        local notes_file=$(mktemp)
        echo "$notes" > "$notes_file"
        
        gh release create "$tag" "$notes_file" --title "$release_name" || {
            log_warning "Failed to create GitHub release (this is optional)"
        }
        
        rm "$notes_file"
    else
        log_warning "GitHub CLI not available, skipping GitHub release"
    fi
}

# Function to cleanup
cleanup() {
    log_info "Cleaning up..."
    
    # Remove test tarball
    local package_name=$(node -p "require('./package.json').name")
    local package_version=$(node -p "require('./package.json').version")
    local tarball="${package_name}-${package_version}.tgz"
    
    if [ -f "$tarball" ]; then
        rm "$tarball"
        log_info "Removed test tarball: $tarball"
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  --dry-run            Run in dry-run mode (no actual publishing)"
    echo "  --skip-tests         Skip running tests"
    echo "  --skip-validation    Skip distribution validation"
    echo "  --publish TAG        Publish to npm with specified tag"
    echo "  --release-notes FILE Use release notes from file"
    echo ""
    echo "Examples:"
    echo "  $0                           # Build and validate distribution"
    echo "  $0 --dry-run                 # Build without publishing"
    echo "  $0 --publish beta            # Build and publish as beta"
    echo "  $0 --skip-tests --publish    # Skip tests and publish"
}

# Main function
main() {
    local skip_tests=false
    local skip_validation=false
    local publish_tag=""
    local release_notes=""
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-validation)
                skip_validation=true
                shift
                ;;
            --publish)
                if [ -z "$2" ] || [ "${2:0:1}" = "-" ]; then
                    log_error "Missing tag value for --publish"
                    exit 1
                fi
                publish_tag="$2"
                shift 2
                ;;
            --release-notes)
                if [ -z "$2" ] || [ "${2:0:1}" = "-" ]; then
                    log_error "Missing filename for --release-notes"
                    exit 1
                fi
                release_notes="$2"
                shift 2
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Start distribution process
    log_info "Starting 9th.js distribution process..."
    
    validate_environment
    install_dependencies
    
    if [ "$skip_tests" != "true" ]; then
        validate_source
    else
        log_warning "Skipping tests as requested"
    fi
    
    build_distribution
    
    if [ "$skip_validation" != "true" ]; then
        validate_distribution
    else
        log_warning "Skipping distribution validation as requested"
    fi
    
    create_package
    
    # Handle publishing
    if [ -n "$publish_tag" ]; then
        publish_package "$publish_tag"
    fi
    
    # Create GitHub release if applicable
    if [ -n "$publish_tag" ] && [ "$publish_tag" != "latest" ]; then
        local package_version=$(node -p "require('./package.json').version")
        local release_name="v$package_version ($publish_tag)"
        
        if [ -n "$release_notes" ] && [ -f "$release_notes" ]; then
            create_github_release "v$package_version" "$release_name" "$(cat "$release_notes")"
        fi
    fi
    
    cleanup
    
    log_success "Distribution process completed successfully!"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "This was a dry run. No changes were made to npm or GitHub."
    fi
}

# Run main function with all arguments
main "$@"