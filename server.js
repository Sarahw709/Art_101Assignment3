const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3001;

// File path for saving game state
const STATE_FILE = path.join(__dirname, 'game-state.json');

// Load game state from file
function loadGameState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            console.log(`📂 Loading game state from: ${STATE_FILE}`);
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            const loaded = JSON.parse(data);
            const blockCount = Object.keys(loaded.blocks || {}).length;
            const tileCount = Object.keys(loaded.tiles || {}).length;
            const cloudCount = (loaded.clouds || []).length;
            const sunCount = (loaded.suns || []).length;
            const rainbowCount = (loaded.rainbows || []).length;
            console.log(`✅ Loaded ${blockCount} blocks, ${tileCount} tiles, ${cloudCount} clouds, ${sunCount} suns, ${rainbowCount} rainbows from saved state`);
            
            if (loaded.lastSaved) {
                console.log(`📅 Last saved: ${loaded.lastSaved}`);
            }
            
            return {
                blocks: loaded.blocks || {},
                tiles: loaded.tiles || {}, // Terrain tiles
                clouds: loaded.clouds || [],
                suns: loaded.suns || [],
                rainbows: loaded.rainbows || [], // Rainbows
                backgroundColor: loaded.backgroundColor || 0x87CEEB, // Background color (default sky blue)
                users: {} // Users are temporary, don't save them
            };
        } else {
            console.log(`📝 No existing game state file found. Creating new state.`);
        }
    } catch (error) {
        console.error('❌ Error loading game state:', error.message);
        console.error('❌ Error stack:', error.stack);
    }
    return {
        blocks: {},
        tiles: {}, // Terrain tiles (floor tiles)
        clouds: [],
        suns: [],
        rainbows: [], // Rainbows
        backgroundColor: 0x87CEEB, // Background color (default sky blue)
        users: {}
    };
}

// Store the game state
const gameState = loadGameState();

// Save game state to file (immediate save for reliability)
function saveGameState() {
    try {
        const dataToSave = {
            blocks: gameState.blocks,
            tiles: gameState.tiles, // Terrain tiles
            clouds: gameState.clouds,
            suns: gameState.suns,
            rainbows: gameState.rainbows, // Rainbows
            backgroundColor: gameState.backgroundColor, // Background color
            lastSaved: new Date().toISOString()
        };
        const dataString = JSON.stringify(dataToSave, null, 2);
        fs.writeFileSync(STATE_FILE, dataString, 'utf8');
        console.log(`💾 Saved game state: ${Object.keys(gameState.blocks).length} blocks, ${Object.keys(gameState.tiles).length} tiles, ${gameState.clouds.length} clouds, ${gameState.suns.length} suns, ${gameState.rainbows.length} rainbows, background: #${gameState.backgroundColor.toString(16)}`);
        return true;
    } catch (error) {
        console.error('❌ Error saving game state:', error.message);
        console.error('❌ Error details:', error);
        return false;
    }
}

// Save immediately on server shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    saveGameState();
    console.log('✅ Server shutdown complete');
    process.exit(0);
});

// Save immediately on uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    saveGameState();
    process.exit(1);
});

// Periodic save every 5 seconds as a safety net
setInterval(() => {
    if (Object.keys(gameState.blocks).length > 0 || Object.keys(gameState.tiles).length > 0 || gameState.clouds.length > 0 || gameState.suns.length > 0 || gameState.rainbows.length > 0) {
        saveGameState();
    }
}, 5000); // Save every 5 seconds

// Serve static files from the current directory
app.use(express.static(__dirname));

// Route for the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`👤 User connected: ${socket.id}`);
    
    // Add user to state
    gameState.users[socket.id] = {
        id: socket.id,
        connectedAt: new Date().toISOString()
    };
    
    // Send current game state to new user
    const initialState = {
        blocks: gameState.blocks,
        tiles: gameState.tiles, // Terrain tiles
        clouds: gameState.clouds,
        suns: gameState.suns,
        rainbows: gameState.rainbows, // Rainbows
        backgroundColor: gameState.backgroundColor, // Background color
        userId: socket.id
    };
    console.log(`📤 Sending initial state to ${socket.id}: ${Object.keys(gameState.blocks).length} blocks, ${Object.keys(gameState.tiles).length} tiles, ${gameState.clouds.length} clouds, ${gameState.suns.length} suns, ${gameState.rainbows.length} rainbows, background: #${gameState.backgroundColor.toString(16)}`);
    socket.emit('initial-state', initialState);
    
    // Send user count to all clients
    const userCount = Object.keys(gameState.users).length;
    io.emit('user-count', userCount);
    
    // Handle block placement
    socket.on('place-block', (data) => {
        try {
            const { key, x, y, z, color } = data;
            
            if (!key || x === undefined || y === undefined || z === undefined) {
                console.error('❌ Invalid block data received:', data);
                return;
            }
            
            console.log(`📦 Received block placement from ${socket.id}:`, { key, x, y, z, color });
            
            // Store the block
            gameState.blocks[key] = {
                x, y, z, color
            };
            
            // Save to file immediately
            const saved = saveGameState();
            if (!saved) {
                console.error('❌ Failed to save game state after block placement');
            }
            
            // Broadcast to ALL clients including the sender
            io.emit('block-placed', { key, x, y, z, color });
            
            console.log(`✅ Block ${key} saved successfully. Total blocks: ${Object.keys(gameState.blocks).length}`);
        } catch (error) {
            console.error('❌ Error handling block placement:', error);
        }
    });
    
    // Handle block removal (undo)
    socket.on('remove-block', (data) => {
        const { key } = data;
        
        // Remove the block
        if (gameState.blocks[key]) {
            delete gameState.blocks[key];
            
            // Save to file
            saveGameState();
            
            // Broadcast to ALL clients including the sender
            io.emit('block-removed', { key });
        }
    });
    
    // Handle terrain tile placement
    socket.on('place-tile', (data) => {
        try {
            const { key, x, z } = data;
            
            if (!key || x === undefined || z === undefined) {
                console.error('❌ Invalid tile data received:', data);
                return;
            }
            
            console.log(`🟩 Received tile placement from ${socket.id}:`, { key, x, z });
            
            // Store the tile
            gameState.tiles[key] = {
                x, z
            };
            
            // Save to file immediately
            const saved = saveGameState();
            if (!saved) {
                console.error('❌ Failed to save game state after tile placement');
            }
            
            // Broadcast to ALL clients including the sender
            io.emit('tile-placed', { key, x, z });
            
            console.log(`✅ Tile ${key} saved successfully. Total tiles: ${Object.keys(gameState.tiles).length}`);
        } catch (error) {
            console.error('❌ Error handling tile placement:', error);
        }
    });
    
    // Handle cloud placement
    socket.on('place-cloud', (data) => {
        const { id, x, y, z } = data;
        
        // Store the cloud
        gameState.clouds.push({ id, x, y, z });
        
        // Save to file
        saveGameState();
        
        // Broadcast to ALL clients including the sender
        io.emit('cloud-placed', { id, x, y, z });
    });
    
    // Handle cloud removal (undo)
    socket.on('remove-cloud', (data) => {
        const { id } = data;
        
        // Remove the cloud
        const index = gameState.clouds.findIndex(c => c.id === id);
        if (index !== -1) {
            gameState.clouds.splice(index, 1);
            
            // Save to file
            saveGameState();
            
            // Broadcast to ALL clients including the sender
            io.emit('cloud-removed', { id });
        }
    });
    
    // Handle sun placement
    socket.on('place-sun', (data) => {
        const { id, x, y, z } = data;
        
        // Store the sun
        gameState.suns.push({ id, x, y, z });
        
        // Save to file
        saveGameState();
        
        // Broadcast to ALL clients including the sender
        io.emit('sun-placed', { id, x, y, z });
    });
    
    // Handle sun removal (undo)
    socket.on('remove-sun', (data) => {
        const { id } = data;
        
        // Remove the sun
        const index = gameState.suns.findIndex(s => s.id === id);
        if (index !== -1) {
            gameState.suns.splice(index, 1);
            
            // Save to file
            saveGameState();
            
            // Broadcast to ALL clients including the sender
            io.emit('sun-removed', { id });
        }
    });
    
    // Handle batch block operations (for undo batching)
    socket.on('remove-blocks-batch', (data) => {
        const { keys } = data;
        
        // Remove all blocks in the batch
        keys.forEach(key => {
            if (gameState.blocks[key]) {
                delete gameState.blocks[key];
            }
        });
        
        // Save to file
        saveGameState();
        
        // Broadcast to ALL clients including the sender
        io.emit('blocks-removed-batch', { keys });
    });
    
    // Handle rainbow placement
    socket.on('place-rainbow', (data) => {
        try {
            const { id, x, y, z } = data;
            
            if (!id || x === undefined || y === undefined || z === undefined) {
                console.error('❌ Invalid rainbow data received:', data);
                return;
            }
            
            console.log(`🌈 Received rainbow placement from ${socket.id}:`, { id, x, y, z });
            
            // Store the rainbow
            gameState.rainbows.push({ id, x, y, z });
            
            // Save to file immediately
            const saved = saveGameState();
            if (!saved) {
                console.error('❌ Failed to save game state after rainbow placement');
            }
            
            // Broadcast to ALL clients including the sender
            io.emit('rainbow-placed', { id, x, y, z });
            
            console.log(`✅ Rainbow ${id} saved successfully. Total rainbows: ${gameState.rainbows.length}`);
        } catch (error) {
            console.error('❌ Error handling rainbow placement:', error);
        }
    });
    
    // Handle rainbow removal (undo)
    socket.on('remove-rainbow', (data) => {
        const { id } = data;
        
        // Remove the rainbow
        const index = gameState.rainbows.findIndex(r => r.id === id);
        if (index !== -1) {
            gameState.rainbows.splice(index, 1);
            
            // Save to file
            saveGameState();
            
            // Broadcast to ALL clients including the sender
            io.emit('rainbow-removed', { id });
        }
    });
    
    // Handle background color change
    socket.on('set-background-color', (data) => {
        try {
            const { color } = data;
            
            if (color === undefined || typeof color !== 'number') {
                console.error('❌ Invalid background color data received:', data);
                return;
            }
            
            console.log(`🎨 Received background color change from ${socket.id}:`, { color: `#${color.toString(16)}` });
            
            // Store the background color
            gameState.backgroundColor = color;
            
            // Save to file immediately
            const saved = saveGameState();
            if (!saved) {
                console.error('❌ Failed to save game state after background color change');
            }
            
            // Broadcast to ALL clients including the sender
            io.emit('background-color-changed', { color });
            
            console.log(`✅ Background color saved successfully: #${color.toString(16)}`);
        } catch (error) {
            console.error('❌ Error handling background color change:', error);
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`👋 User disconnected: ${socket.id}`);
        delete gameState.users[socket.id];
        
        // Send updated user count to all clients
        const userCount = Object.keys(gameState.users).length;
        io.emit('user-count', userCount);
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🎮 3D Terrain Builder ready!`);
    console.log(`💾 Game state will be saved to: ${STATE_FILE}`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use!`);
        console.error(`\n💡 Solutions:`);
        console.error(`   1. Kill the process using port ${PORT}:`);
        console.error(`      lsof -ti :${PORT} | xargs kill -9`);
        console.error(`   2. Or find and kill it manually:`);
        console.error(`      lsof -i :${PORT}`);
        console.error(`   3. Or use a different port:`);
        console.error(`      PORT=3002 node server.js`);
        process.exit(1);
    } else {
        console.error(`❌ Server error:`, error);
        process.exit(1);
    }
});

