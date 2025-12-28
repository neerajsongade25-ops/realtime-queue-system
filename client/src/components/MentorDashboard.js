import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MentorDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  // 1. Initial Data Load & Auth Check
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'mentor') navigate('/');

    // Load existing tickets from Database
    const fetchTickets = async () => {
      const res = await axios.get('http://localhost:5000/api/tickets');
      setTickets(res.data);
    };
    fetchTickets();
  }, [navigate]);

  // 2. REAL-TIME LISTENERS
  useEffect(() => {
    // When a student creates a ticket
    socket.on('new_ticket', (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      toast.info(`🔔 New Ticket: ${ticket.title}`);
    });

    // When a ticket status changes (claimed/resolved)
    socket.on('ticket_updated', (updatedTicket) => {
      setTickets((prev) => 
        prev.map((t) => t._id === updatedTicket._id ? updatedTicket : t)
      );
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off('new_ticket');
      socket.off('ticket_updated');
    };
  }, []);

  // 3. Action: Claim Ticket
  const claimTicket = async (ticketId) => {
    try {
      const mentorId = localStorage.getItem('userId');
      await axios.patch(`http://localhost:5000/api/tickets/${ticketId}`, {
        status: 'in-progress',
        mentorId
      });
      // Note: We don't need to manually update state here, 
      // because the Server will emit 'ticket_updated', which we listen for above!
    } catch (err) {
      toast.error('Error claiming ticket');
    }
  };

  // 4. Action: Resolve Ticket
  const resolveTicket = async (ticketId) => {
    try {
      await axios.patch(`http://localhost:5000/api/tickets/${ticketId}`, {
        status: 'resolved'
      });
    } catch (err) {
      toast.error('Error resolving ticket');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>👨‍🏫 Mentor Dashboard</h1>
      <p>Watching for new tickets...</p>

      <div style={{ display: 'grid', gap: '10px' }}>
        {tickets.map((ticket) => (
          <div key={ticket._id} style={{ 
            border: '1px solid #ccc', 
            padding: '15px', 
            background: ticket.status === 'pending' ? '#fff3cd' : '#d4edda' 
          }}>
            <h3>{ticket.title}</h3>
            <p>{ticket.description}</p>
            <p><strong>Student:</strong> {ticket.student?.name}</p>
            <p><strong>Status:</strong> {ticket.status.toUpperCase()}</p>
            
            {ticket.status === 'pending' && (
              <button onClick={() => claimTicket(ticket._id)} style={{ background: 'green', color: 'white', padding: '5px 10px' }}>
                Claim Ticket
              </button>
            )}

            {ticket.status === 'in-progress' && (
              <button onClick={() => resolveTicket(ticket._id)} style={{ background: 'blue', color: 'white', padding: '5px 10px' }}>
                Mark Resolved
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MentorDashboard;