import io from 'socket.io-client';

// Connect to your Backend URL
const socket = io('http://localhost:5000');

export default socket;