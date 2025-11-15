#!/bin/bash

# 9th.js Documentation Development Server
# Simple script to serve documentation locally with live reload

DOCS_DIR="docs"
PORT=${1:-3000}
HOST="localhost"

echo "🚀 Starting 9th.js Documentation Server"
echo "📁 Serving from: $DOCS_DIR"
echo "🌐 URL: http://$HOST:$PORT"
echo "📚 Documentation will be available at: http://$HOST:$PORT/api/index.html"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3 HTTP server"
    cd "$DOCS_DIR"
    python3 -m http.server "$PORT" --bind "$HOST"
elif command -v python &> /dev/null; then
    echo "✅ Using Python 2 HTTP server"
    cd "$DOCS_DIR"
    python -m SimpleHTTPServer "$PORT" --bind "$HOST"
elif command -v node &> /dev/null; then
    echo "✅ Using Node.js http-server"
    npx http-server "$DOCS_DIR" -p "$PORT" -a "$HOST"
else
    echo "❌ Error: No suitable HTTP server found"
    echo "Please install Python 3, Python 2, or Node.js to serve the documentation"
    exit 1
fi