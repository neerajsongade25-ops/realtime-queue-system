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

// 1. Middleware (Must be at the top)
app.use(cors());
app.use(express.json());

// 2. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 3. Socket.io Setup
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

// 4. INJECT SOCKET INTO REQUESTS (CRITICAL: Must be BEFORE Routes)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 5. Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));

// 6. Basic Route
app.get('/', (req, res) => {
  res.send('Queue System Server is Running');
});

// 7. Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});