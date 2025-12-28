import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket'; // Import the socket connection
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [myTickets, setMyTickets] = useState([]);
  const navigate = useNavigate();

  // 1. Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) navigate('/');
    if (role !== 'student') navigate('/mentor');
  }, [navigate]);

  // 2. Listen for updates (e.g., Mentor claimed my ticket)
  useEffect(() => {
    socket.on('ticket_updated', (updatedTicket) => {
      setMyTickets((prev) => 
        prev.map((ticket) => ticket._id === updatedTicket._id ? updatedTicket : ticket)
      );
      
      // If this is MY ticket, notify me
      const myId = localStorage.getItem('userId');
      if (updatedTicket.student._id === myId && updatedTicket.status === 'in-progress') {
        toast.info(`👨‍🏫 A mentor is helping you with: ${updatedTicket.title}`);
      }
    });

    return () => socket.off('ticket_updated');
  }, []);

  // 3. Submit a new Ticket
  const createTicket = async (e) => {
    e.preventDefault();
    try {
      const studentId = localStorage.getItem('userId');
      const res = await axios.post('http://localhost:5000/api/tickets', {
        studentId,
        title,
        description
      });
      
      setMyTickets([res.data, ...myTickets]); // Add new ticket to top
      setTitle('');
      setDescription('');
      toast.success('Ticket Created! Wait for a mentor.');
    } catch (err) {
      toast.error('Error creating ticket');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎓 Student Dashboard</h1>
      
      {/* Create Ticket Form */}
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px' }}>
        <h3>Ask for Help</h3>
        <form onSubmit={createTicket}>
          <input 
            type="text" 
            placeholder="Problem Title (e.g. React Error)" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <textarea 
            placeholder="Describe the issue..." 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none' }}>
            Submit Ticket
          </button>
        </form>
      </div>

      {/* My Tickets List */}
      <h3>My Active Tickets</h3>
      {myTickets.map((ticket) => (
        <div key={ticket._id} style={{ border: '1px solid #ddd', padding: '10px', marginTop: '10px' }}>
          <h4>{ticket.title}</h4>
          <p>Status: <strong>{ticket.status.toUpperCase()}</strong></p>
          {ticket.mentor && <p>Mentor: {ticket.mentor.name}</p>}
        </div>
      ))}
    </div>
  );
};

export default StudentDashboard;