#!/bin/bash

# Kill any process using port 3001
echo "🔍 Checking for processes on port 3001..."
PID=$(lsof -ti :3001)
if [ ! -z "$PID" ]; then
    echo "⚠️  Found process $PID using port 3001. Killing it..."
    kill -9 $PID
    sleep 1
    echo "✅ Port 3001 is now free"
else
    echo "✅ Port 3001 is available"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🚀 Starting server..."
node server.js

