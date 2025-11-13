# 3D Terrain Builder - Art 101 Assignment 3

A collaborative 3D terrain building game with real-time multiplayer and persistent state.

## Setup Instructions

### 1. Install Dependencies
```bash
cd Art_101Assignment3
npm install
```

### 2. Start the Server
```bash
node server.js
```

The server will start on `http://localhost:3001`

### 3. Open in Browser
Open your browser and navigate to:
```
http://localhost:3001
```

## How Persistence Works

- **Game state is saved to `game-state.json`** in the server directory
- **Blocks are saved immediately** when placed (no delay)
- **State is loaded automatically** when you refresh the page
- **Periodic saves** occur every 5 seconds as a safety net

## Troubleshooting

### Progress Not Saving?

1. **Make sure the server is running:**
   - Check the terminal for server logs
   - Look for messages like "💾 Saved game state: X blocks"
   - Server should show "🚀 Server is running on http://localhost:3001"

2. **Check browser console:**
   - Open Developer Tools (F12)
   - Look for connection messages: "✅ Connected to server"
   - Look for block send messages: "✅ Sent block to server"
   - If you see "⚠️ Block not sent - socket not connected yet", the server isn't running

3. **Check server console:**
   - Should show "📦 Received block placement from [socket.id]"
   - Should show "💾 Saved game state: X blocks"
   - Should show "✅ Block [key] saved successfully"

4. **Verify the state file:**
   - Check if `game-state.json` exists in the server directory
   - The file should contain your blocks in JSON format
   - If the file is empty or missing, blocks aren't being saved

5. **Make sure you're accessing through the server:**
   - Don't open `index.html` directly in the browser
   - Use `http://localhost:3001` in the browser
   - The server must be running for persistence to work

## Features

- **Real-time multiplayer**: See other users' blocks in real-time
- **Persistent state**: All progress is saved and loaded automatically
- **Terrain building**: Build terrain horizontally or vertically
- **Clouds and suns**: Add decorative elements to the sky
- **Undo functionality**: Press Ctrl+Z to undo your last action
- **Color picker**: Choose from 6 muted colors

## Controls

- **W/A/S/D**: Move around
- **Space/Shift**: Move up/down
- **Mouse**: Look around (press Esc to lock mouse)
- **Click and hold**: Build terrain (horizontal or vertical mode)
- **T**: Toggle between horizontal expansion and vertical building
- **Ctrl+Z**: Undo last action
- **Click cloud/sun icons**: Add clouds or suns to the sky

## Server Commands

- **Start server**: `node server.js`
- **Stop server**: Press `Ctrl+C` in the terminal (state will be saved automatically)

