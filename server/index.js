require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/User');
const Ticket = require('./models/Ticket');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
// Routes
app.use('/api/auth', require('./routes/auth'));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Socket.io Setup (Real-time Engine)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Your Client URL
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`⚡: New Client Connected (${socket.id})`);
  
  socket.on('disconnect', () => {
    console.log('🔥: Client Disconnected');
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Queue System Server is Running');
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});