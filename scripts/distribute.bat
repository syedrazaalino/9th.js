@echo off
REM Enhanced Distribution Script for 9th.js (Windows Batch)
REM This script handles the complete distribution process

setlocal enabledelayedexpansion

REM Script configuration
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR:~0,-10%"
set "DIST_DIR=%PROJECT_ROOT%\dist"

REM Environment variables
set "NODE_VERSION="
set "NPM_VERSION="
set "PACKAGE_NAME="
set "PACKAGE_VERSION="
set "DRY_RUN=false"
set "SKIP_TESTS=false"
set "SKIP_VALIDATION=false"
set "PUBLISH_TAG="
set "RELEASE_NOTES="

REM Logging functions
echo.
echo ==========================================
echo   9th.js Distribution Script (Windows)
echo ==========================================
echo.

:log_info
echo ℹ️  %~1
goto :eof

:log_success
echo ✅ %~1
goto :eof

:log_warning
echo ⚠️  %~1
goto :eof

:log_error
echo ❌ %~1
goto :eof

REM Function to check if command exists
:command_exists
where %1 >nul 2>nul
exit /b %errorlevel%

REM Function to validate environment
:validate_environment
call :log_info "Validating environment..."

REM Check Node.js version
call :command_exists node
if !errorlevel! neq 0 (
    call :log_error "Node.js is not installed"
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "NODE_VERSION=%%i"
call :log_info "Node.js version: !NODE_VERSION!"

REM Extract major version (simplified for Windows)
echo !NODE_VERSION! | findstr /r "v[0-9]" >nul
if !errorlevel! neq 0 (
    call :log_error "Invalid Node.js version format"
    exit /b 1
)

REM Check npm version
call :command_exists npm
if !errorlevel! neq 0 (
    call :log_error "npm is not installed"
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set "NPM_VERSION=%%i"
call :log_info "npm version: !NPM_VERSION!"

REM Check if required files exist
if not exist "%PROJECT_ROOT%\package.json" (
    call :log_error "package.json not found"
    exit /b 1
)

if not exist "%PROJECT_ROOT%\rollup.config.js" (
    call :log_error "rollup.config.js not found"
    exit /b 1
)

call :log_success "Environment validation completed"
goto :eof

REM Function to install dependencies
:install_dependencies
call :log_info "Installing dependencies..."

if not exist "%PROJECT_ROOT%\node_modules" (
    call :log_info "Installing dependencies from package.json..."
    call npm install
) else (
    call :log_info "Dependencies already installed, running npm ci..."
    call npm ci
)

if !errorlevel! neq 0 (
    call :log_error "Failed to install dependencies"
    exit /b 1
)

call :log_success "Dependencies installed"
goto :eof

REM Function to run pre-build validation
:validate_source
call :log_info "Validating source code..."

REM Type checking
call :log_info "Running TypeScript type check..."
call npm run type-check
if !errorlevel! neq 0 (
    call :log_error "TypeScript type check failed"
    exit /b 1
)

REM Linting
call :log_info "Running ESLint..."
call npm run lint
if !errorlevel! neq 0 (
    call :log_error "ESLint failed"
    exit /b 1
)

REM Running tests
call :log_info "Running tests..."
call npm test
if !errorlevel! neq 0 (
    call :log_error "Tests failed"
    exit /b 1
)

call :log_success "Source validation completed"
goto :eof

REM Function to build distribution
:build_distribution
call :log_info "Building distribution..."

REM Clean existing dist
call npm run clean
if !errorlevel! neq 0 (
    call :log_error "Failed to clean distribution directory"
    exit /b 1
)

REM Build all targets
call npm run build
if !errorlevel! neq 0 (
    call :log_error "Build failed"
    exit /b 1
)

REM Verify build output
if not exist "%DIST_DIR%" (
    call :log_error "Distribution directory not created"
    exit /b 1
)

REM Check file sizes
call :log_info "Checking build output..."
call npm run analyze
if !errorlevel! neq 0 (
    call :log_warning "Build analysis failed, but continuing..."
)

call :log_success "Distribution build completed"
goto :eof

REM Function to validate distribution
:validate_distribution
call :log_info "Validating distribution..."

REM Run custom validation scripts
call npm run validate-dist
if !errorlevel! neq 0 (
    call :log_error "Distribution validation failed"
    exit /b 1
)

call npm run verify-exports
if !errorlevel! neq 0 (
    call :log_error "Export validation failed"
    exit /b 1
)

call :log_success "Distribution validation completed"
goto :eof

REM Function to create distribution package
:create_package
call :log_info "Creating distribution package..."

REM Check package.json integrity
call npm run verify-exports >nul 2>&1
if !errorlevel! neq 0 (
    call :log_warning "Package exports validation has warnings"
)

REM Create tarball for testing
call npm pack
if !errorlevel! neq 0 (
    call :log_error "Failed to create package tarball"
    exit /b 1
)

REM Extract package info
for /f "tokens=2 delims== " %%i in ('findstr "name" "%PROJECT_ROOT%\package.json"') do set "PACKAGE_NAME=%%i"
for /f "tokens=2 delims== " %%i in ('findstr "version" "%PROJECT_ROOT%\package.json"') do set "PACKAGE_VERSION=%%i"

REM Remove quotes
set "PACKAGE_NAME=!PACKAGE_NAME:"=!"
set "PACKAGE_VERSION=!PACKAGE_VERSION:"=!"

set "TARBALL=!PACKAGE_NAME!-!PACKAGE_VERSION!.tgz"

if exist "%TARBALL%" (
    call :log_info "Package tarball created: !TARBALL!"
    
    REM Test package in a temporary directory
    set "TEMP_DIR=%TEMP%\ninthjs_test_!RANDOM!"
    mkdir "!TEMP_DIR!" 2>nul
    
    pushd "!TEMP_DIR!"
    call :log_info "Testing package installation in temporary directory..."
    call npm install "%PROJECT_ROOT%\!TARBALL!"
    
    if !errorlevel! neq 0 (
        call :log_error "Package installation test failed"
        popd
        rmdir /s /q "!TEMP_DIR!" 2>nul
        exit /b 1
    )
    
    REM Clean up temp directory
    popd
    rmdir /s /q "!TEMP_DIR!" 2>nul
    
    call :log_success "Package testing completed"
)

call :log_success "Distribution package created"
goto :eof

REM Function to publish to npm (optional)
:publish_package
if "%DRY_RUN%"=="true" (
    call :log_info "DRY RUN: Would publish to npm with tag %1"
    goto :eof
)

call :log_info "Publishing to npm with tag %1..."

REM Check if user is logged in
npm whoami >nul 2>&1
if !errorlevel! neq 0 (
    call :log_error "You are not logged in to npm. Run 'npm login' first."
    exit /b 1
)

REM Publish with tag
npm publish --tag %1
if !errorlevel! neq 0 (
    call :log_error "Failed to publish package"
    exit /b 1
)

call :log_success "Package published to npm"
goto :eof

REM Function to cleanup
:cleanup
call :log_info "Cleaning up..."

REM Remove test tarball
if exist "!TARBALL!" (
    del "!TARBALL!"
    call :log_info "Removed test tarball: !TARBALL!"
)

goto :eof

REM Function to show usage
:show_usage
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   -h, --help           Show this help message
echo   --dry-run            Run in dry-run mode (no actual publishing)
echo   --skip-tests         Skip running tests
echo   --skip-validation    Skip distribution validation
echo   --publish TAG        Publish to npm with specified tag
echo   --release-notes FILE Use release notes from file
echo.
echo Examples:
echo   %0                           # Build and validate distribution
echo   %0 --dry-run                 # Build without publishing
echo   %0 --publish beta            # Build and publish as beta
echo   %0 --skip-tests --publish    # Skip tests and publish
echo.
goto :eof

REM Function to parse command line arguments
:parse_arguments
:arg_loop
if "%~1"=="" goto :arg_done

if "%~1"=="-h" goto :show_help
if "%~1"=="--help" goto :show_help
if "%~1"=="--dry-run" (
    set "DRY_RUN=true"
    shift
    goto :arg_loop
)
if "%~1"=="--skip-tests" (
    set "SKIP_TESTS=true"
    shift
    goto :arg_loop
)
if "%~1"=="--skip-validation" (
    set "SKIP_VALIDATION=true"
    shift
    goto :arg_loop
)
if "%~1"=="--publish" (
    if "%~2"=="" (
        call :log_error "Missing tag value for --publish"
        exit /b 1
    )
    set "PUBLISH_TAG=%~2"
    shift 2
    goto :arg_loop
)
if "%~1"=="--release-notes" (
    if "%~2"=="" (
        call :log_error "Missing filename for --release-notes"
        exit /b 1
    )
    if not exist "%~2" (
        call :log_error "Release notes file not found: %~2"
        exit /b 1
    )
    set "RELEASE_NOTES=%~2"
    shift 2
    goto :arg_loop
)

call :log_error "Unknown option: %1"
goto :show_usage

:arg_done
goto :eof

REM Main function
:main
call :parse_arguments %*

call :log_info "Starting 9th.js distribution process..."

call :validate_environment
if !errorlevel! neq 0 exit /b 1

call :install_dependencies
if !errorlevel! neq 0 exit /b 1

if "%SKIP_TESTS%"=="false" (
    call :validate_source
    if !errorlevel! neq 0 exit /b 1
) else (
    call :log_warning "Skipping tests as requested"
)

call :build_distribution
if !errorlevel! neq 0 exit /b 1

if "%SKIP_VALIDATION%"=="false" (
    call :validate_distribution
    if !errorlevel! neq 0 exit /b 1
) else (
    call :log_warning "Skipping distribution validation as requested"
)

call :create_package
if !errorlevel! neq 0 exit /b 1

REM Handle publishing
if not "%PUBLISH_TAG%"=="" (
    call :publish_package "%PUBLISH_TAG%"
    if !errorlevel! neq 0 exit /b 1
)

call :cleanup

call :log_success "Distribution process completed successfully!"

if "%DRY_RUN%"=="true" (
    call :log_info "This was a dry run. No changes were made to npm."
)

echo.
echo ==========================================
echo   Distribution Script Completed
echo ==========================================
echo.

exit /b 0

:show_help
call :show_usage
exit /b 0