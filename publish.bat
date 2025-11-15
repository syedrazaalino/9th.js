@echo off
REM 9th.js NPM Publishing Script for Windows
REM Run this script from your local machine after downloading the project

echo =========================================
echo 9th.js NPM Publishing Script
echo =========================================
echo.

REM Check if npm is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed
    echo Please install Node.js and npm first
    pause
    exit /b 1
)

echo npm is installed
echo.

REM Check if logged in to npm
npm whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo You are not logged in to NPM
    echo Please login with your credentials:
    echo Username: digitalcloud.no
    echo.
    npm login
    echo.
)

FOR /F "tokens=*" %%i IN ('npm whoami') DO SET NPM_USER=%%i
echo Logged in as: %NPM_USER%
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
echo Dependencies installed
echo.

REM Build the package
echo Building package...
call npm run build

if not exist "dist" (
    echo Error: Build failed - dist folder not created
    pause
    exit /b 1
)

echo Build completed successfully
echo.

REM Show package info
echo Package Information:
FOR /F "tokens=*" %%i IN ('node -p "require('./package.json').name"') DO echo    Name: %%i
FOR /F "tokens=*" %%i IN ('node -p "require('./package.json').version"') DO echo    Version: %%i
FOR /F "tokens=*" %%i IN ('node -p "require('./package.json').description"') DO echo    Description: %%i
echo.

REM Create test package
echo Creating test package...
call npm pack
echo Test package created
echo.

REM Ask for confirmation
set /p CONFIRM="Ready to publish to NPM? (y/n) "
if /i not "%CONFIRM%"=="y" (
    echo Publishing cancelled
    pause
    exit /b 0
)

REM Publish to NPM
echo Publishing to NPM...
call npm publish

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================
    echo Successfully published to NPM!
    echo =========================================
    echo.
    echo Your package is now available at:
    echo https://www.npmjs.com/package/ninth-js
    echo https://unpkg.com/ninth-js@latest/dist/ninth-js.umd.js
    echo.
    echo Install with:
    echo npm install ninth-js
    echo.
) else (
    echo.
    echo Publishing failed
    echo Please check the error message above
    pause
    exit /b 1
)

pause
