import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle'; // <--- Import

const StudentDashboard = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [myTickets, setMyTickets] = useState([]);
  const navigate = useNavigate();

  // AUTH CHECK & LOAD DATA
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/');
  }, [navigate]);

  useEffect(() => {
    socket.on('ticket_updated', (updatedTicket) => {
      setMyTickets((prev) => 
        prev.map((ticket) => ticket._id === updatedTicket._id ? updatedTicket : ticket)
      );
      if (updatedTicket.student._id === localStorage.getItem('userId') && updatedTicket.status === 'in-progress') {
        toast.info(`👨‍🏫 Mentor is helping with: ${updatedTicket.title}`);
      }
    });
    return () => socket.off('ticket_updated');
  }, []);

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      const studentId = localStorage.getItem('userId');
      const res = await axios.post('http://localhost:5000/api/tickets', { studentId, title, description });
      setMyTickets([res.data, ...myTickets]);
      setTitle(''); setDescription('');
      toast.success('Ticket in Queue!');
    } catch (err) { toast.error('Failed to create ticket'); }
  };



  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="logo">QueueSystem</div>
        <ThemeToggle />  {/* <--- ADD BUTTON HERE */}
        <button onClick={logout} className="nav-btn">Logout</button>
      </nav>

      <div className="dashboard-container">
        <div className="header-section">
          <h1>Student Dashboard</h1>
          <p>Need help? Raise a ticket below.</p>
        </div>

        {/* Input Form */}
        <div className="ticket-form-card">
          <h3 style={{ marginBottom: '1rem' }}>🎫 Create New Ticket</h3>
          <form onSubmit={createTicket}>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Issue Title (e.g. MongoDB Connection Error)" required />
            <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your problem in detail..." rows="3" required></textarea>
            <button className="btn-primary" style={{ width: 'auto', padding: '10px 30px' }} type="submit">Submit Ticket</button>
          </form>
        </div>

        {/* Ticket List */}
        <h3 style={{ marginBottom: '1rem' }}>My Recent Tickets</h3>
        <div className="ticket-grid">
          {myTickets.map((ticket) => (
            <div key={ticket._id} className={`ticket-card status-${ticket.status}`}>
              <div>
                <div className="ticket-header">
                  <span className="ticket-title">{ticket.title}</span>
                  <span className={`status-badge badge-${ticket.status}`}>{ticket.status}</span>
                </div>
                <p className="ticket-desc">{ticket.description}</p>
              </div>
              {ticket.mentor && <small style={{ color: '#4f46e5', fontWeight: 'bold' }}>👨‍🏫 Mentor: {ticket.mentor.name}</small>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;