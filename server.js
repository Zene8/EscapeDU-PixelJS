const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve the index.html file for all unmatched routes
app.use(express.static(path.join(__dirname, 'public')));

// Sample room data
const rooms = {
    room1: {
        background: '/assets/backgrounds/room1.webp',
        hints: [
            { id: 1, x: 100, y: 200, description: 'A shiny object on the table.' }
        ],
        door: { x: 500, y: 300, nextRoom: 'room2', code: '1234' }
    },
    room2: {
        background: '/assets/backgrounds/room2.png',
        hints: [
            { id: 2, x: 200, y: 250, description: 'A key hidden under a mat.' }
        ],
        door: { x: 600, y: 350, nextRoom: 'room3', code: '5678' }
    }
};
const sprites = {
    player1: {
        sprite: '/assets/sprites/player.png'
    }
};

// API to get room data
app.get('/room/:id', (req, res) => {
    const roomId = req.params.id;
    const room = rooms[roomId];
    if (room) {
        res.json(room);
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
});

app.get('/sprite/:id',(req,res)=>{
    const spriteID = req.params.id;
    const sprite = sprites[spriteID]
    if(sprite){
        res.json(sprite);
    } else{
        res.status(404).json({error:'Sprite Not Found'});
    }
})


// Middleware to serve index.html for any other route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
