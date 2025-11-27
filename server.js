import { createServer } from 'http';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3000;

// Create basic HTTP server
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Royal 235 Relay Server is Running OK');
});

// Create Socket.IO server with CORS enabled
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins (frontend apps) to connect
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Allow fallback to polling if websocket fails
});

io.on('connection', (socket) => {
  console.log(`[Connect] User Connected: ${socket.id}`);

  // Join a specific room
  socket.on('join-room', (roomId) => {
    try {
      socket.join(roomId);
      console.log(`[Join] User ${socket.id} joined room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit('player-connected', { socketId: socket.id });
    } catch (e) {
      console.error(`[Error] Join room failed: ${e.message}`);
    }
  });

  // Relay Game Messages
  socket.on('game-message', (data) => {
    try {
      const { roomId, message } = data;
      if (!roomId) return;
      // Broadcast to everyone else in the room
      socket.to(roomId).emit('game-message', message);
    } catch (e) {
      console.error(`[Error] Relay message failed: ${e.message}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Disconnect] User ${socket.id}: ${reason}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});