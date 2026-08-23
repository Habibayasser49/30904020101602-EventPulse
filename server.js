require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');

connectDB();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join-event', (eventId) => {
        socket.join(eventId);
        console.log(`Socket ${socket.id} joined event ${eventId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});