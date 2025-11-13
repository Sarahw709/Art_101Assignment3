# Quick Start Guide - Fix "Not Connected to Server" Error

## Step 1: Install Dependencies

Open a terminal and run:

```bash
cd /Users/swheeler/Documents/GitHub/Art_101Assignment3
npm install
```

This will install `express` and `socket.io` which are required for the server to run.

**Expected output:**
```
added 50 packages, and audited 51 packages in 2s
```

## Step 2: Start the Server

In the same terminal, run:

```bash
node server.js
```

**Expected output:**
```
🚀 Server is running on http://localhost:3001
📁 Serving files from: /Users/swheeler/Documents/GitHub/Art_101Assignment3
🎮 3D Terrain Builder ready!
💾 Game state will be saved to: /Users/swheeler/Documents/GitHub/Art_101Assignment3/game-state.json
```

**Keep this terminal window open!** The server must keep running for the webpage to work.

## Step 3: Open the Webpage

Open your browser and go to:

```
http://localhost:3001
```

**Important:** Don't open `index.html` directly in the browser. You must access it through the server at `http://localhost:3001`.

## Step 4: Verify Connection

You should see:
- ✅ The loading screen disappears
- ✅ No red warning message at the top
- ✅ The game loads with any previously saved blocks
- ✅ In browser console (F12): "✅ Connected to server"
- ✅ In server terminal: "👤 User connected: [socket-id]"

## Troubleshooting

### Error: "Cannot find module 'socket.io'"

**Solution:** Run `npm install` in the `Art_101Assignment3` directory.

### Error: "Port 3001 is already in use"

**Solution:** 
1. Find what's using port 3001: `lsof -i :3001`
2. Kill the process: `kill -9 [PID]`
3. Or change the port in `server.js` (line 11)

### Red Warning Still Shows

**Check:**
1. Is the server running? Check the terminal where you ran `node server.js`
2. Are you accessing `http://localhost:3001` (not opening the HTML file directly)?
3. Check browser console (F12) for connection errors
4. Check server terminal for error messages

### Server Won't Start

**Check:**
1. Are you in the correct directory? (`Art_101Assignment3`)
2. Are dependencies installed? (`npm install`)
3. Is Node.js installed? (`node --version`)
4. Check for error messages in the terminal

## Quick Commands

```bash
# Install dependencies
npm install

# Start server
node server.js

# Or use the startup script
./START_SERVER.sh
```

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running. The game state will be saved automatically before the server stops.

