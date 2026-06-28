const { Server } = require('socket.io');

let io;

// Maps userId → socketId so we can send events to specific users
const onlineUsers = new Map();

/** Attaches a Socket.IO server to the HTTP server and registers connection/disconnect handlers. */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // The frontend sends userId in the auth handshake when connecting
    const userId = socket.handshake.auth.userId;

    if (userId) {
      onlineUsers.set(String(userId), socket.id);

      // Tell everyone this user is now online
      io.emit('user:online', { userId: String(userId) });

      // Send the new client the full list of who's currently online
      socket.emit('users:online-list', Array.from(onlineUsers.keys()));
    }

    socket.on('disconnect', () => {
      if (userId && onlineUsers.get(String(userId)) === socket.id) {
        onlineUsers.delete(String(userId));
        io.emit('user:offline', { userId: String(userId) });
      }
    });
  });

  return io;
}

// Send an event to a specific user by their userId (not socketId)
function emitToUser(userId, event, data) {
  const socketId = onlineUsers.get(String(userId));
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

function getIO() {
  return io;
}

module.exports = { initSocket, emitToUser, getIO };
