import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const MentorDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      const res = await axios.get('http://localhost:5000/api/tickets');
      setTickets(res.data);
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    socket.on('new_ticket', (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      toast.info(`🔔 New Ticket: ${ticket.title}`);
    });
    socket.on('ticket_updated', (updatedTicket) => {
      setTickets((prev) => prev.map((t) => t._id === updatedTicket._id ? updatedTicket : t));
    });
    return () => { socket.off('new_ticket'); socket.off('ticket_updated'); };
  }, []);

  const handleAction = async (ticketId, status) => {
    try {
      const mentorId = localStorage.getItem('userId');
      await axios.patch(`http://localhost:5000/api/tickets/${ticketId}`, { status, mentorId });
      toast.success(status === 'in-progress' ? 'Ticket Claimed!' : 'Ticket Resolved!');
    } catch (err) { toast.error('Action Failed'); }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">QueueSystem <span style={{fontSize: '0.8rem', color: '#666', fontWeight: 'normal'}}>(Mentor View)</span></div>
        <ThemeToggle /> {/* <--- ADD HERE */}
        <button onClick={logout} className="nav-btn">Logout</button>
      </nav>

      <div className="dashboard-container">
        <div className="header-section">
          <h1>Live Queue</h1>
          <span className="status-badge badge-in-progress" style={{ fontSize: '1rem' }}>
            {tickets.filter(t => t.status === 'pending').length} Pending
          </span>
        </div>

        <div className="ticket-grid">
          {tickets.map((ticket) => (
            <div key={ticket._id} className={`ticket-card status-${ticket.status}`}>
              <div>
                <div className="ticket-header">
                  <span className="ticket-title">{ticket.title}</span>
                  <span className={`status-badge badge-${ticket.status}`}>{ticket.status}</span>
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <small style={{ color: '#6b7280' }}>Student: <strong>{ticket.student?.name}</strong></small>
                </div>
                <p className="ticket-desc">{ticket.description}</p>
              </div>

              {/* ACTION BUTTONS */}
              {ticket.status === 'pending' && (
                <button onClick={() => handleAction(ticket._id, 'in-progress')} className="btn-action btn-claim">
                  ✋ Claim Ticket
                </button>
              )}
              {ticket.status === 'in-progress' && (
                <button onClick={() => handleAction(ticket._id, 'resolved')} className="btn-action btn-resolve">
                  ✅ Mark Resolved
                </button>
              )}
              {ticket.status === 'resolved' && (
                 <div style={{textAlign: 'center', color: '#10b981', fontWeight: 'bold'}}>✨ Resolved</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default MentorDashboard;