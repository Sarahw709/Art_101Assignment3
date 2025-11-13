#!/bin/bash

# Start Server Script for Art 101 Assignment 3
# This script installs dependencies and starts the server

echo "🚀 Starting Art 101 Assignment 3 Server..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if dependencies are installed
if ! node -e "require('socket.io'); require('express');" 2>/dev/null; then
    echo "❌ Dependencies are missing. Installing..."
    npm install
    echo ""
fi

# Start the server
echo "🌟 Starting server on http://localhost:3001"
echo "📝 Press Ctrl+C to stop the server"
echo ""
node server.js

