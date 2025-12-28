import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const StudentDashboard = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });
  const navigate = useNavigate();

  const userId = localStorage.getItem('userId');
  const userName = localStorage.getItem('userName');
  const token = localStorage.getItem('token');

  // AUTH CHECK & LOAD DATA
  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    fetchTickets();
  }, [navigate, token]);

  // Socket listeners
  useEffect(() => {
    socket.on('ticket_updated', (updatedTicket) => {
      console.log('Ticket updated received:', updatedTicket);
      
      // Update the specific ticket
      setMyTickets(prev => 
        prev.map(ticket => 
          ticket._id === updatedTicket._id ? { ...ticket, ...updatedTicket } : ticket
        )
      );
      
      // Show notification if it's the current user's ticket
      if (updatedTicket.student === userId || updatedTicket.student?._id === userId) {
        if (updatedTicket.status === 'in-progress') {
          const mentorName = updatedTicket.mentor?.name || 'a mentor';
          toast.info(`👨‍🏫 ${mentorName} is now helping with: ${updatedTicket.title}`);
        } else if (updatedTicket.status === 'resolved') {
          toast.success(`✅ Ticket resolved: ${updatedTicket.title}`);
        }
      }
    });

    // Listen for new tickets created by this student
    socket.on('new_ticket', (newTicket) => {
      console.log('New ticket received:', newTicket);
      if (newTicket.student === userId || newTicket.student?._id === userId) {
        setMyTickets(prev => [newTicket, ...prev]);
        toast.success(`🎫 Ticket created: ${newTicket.title}`);
      }
    });

    return () => {
      socket.off('ticket_updated');
      socket.off('new_ticket');
    };
  }, [userId]);

  // Update stats whenever myTickets changes
  useEffect(() => {
    updateStats();
  }, [myTickets]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tickets');
      console.log('All tickets from API:', res.data);
      
      // Filter tickets for current student
      const studentTickets = res.data.filter(ticket => 
        ticket.student === userId || ticket.student?._id === userId
      );
      
      console.log('Student tickets:', studentTickets);
      setMyTickets(studentTickets);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      toast.error('Failed to load tickets');
    }
  };

  const updateStats = () => {
    const pending = myTickets.filter(t => t.status === 'pending').length;
    const inProgress = myTickets.filter(t => t.status === 'in-progress').length;
    const resolved = myTickets.filter(t => t.status === 'resolved').length;
    
    setStats({
      pending,
      inProgress,
      resolved,
      total: myTickets.length
    });
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const studentId = localStorage.getItem('userId');
      const res = await axios.post('http://localhost:5000/api/tickets', {
        title,
        description,
        studentId  // or 'student' depending on your backend
      });
      
      console.log('Ticket created:', res.data);
      
      // Add the new ticket to the list
      setMyTickets(prev => [res.data, ...prev]);
      setTitle('');
      setDescription('');
      
      toast.success('🎫 Ticket created successfully! A mentor will assist you shortly.');
      
      // Emit socket event for real-time update
      socket.emit('new_ticket', res.data);
    } catch (err) {
      console.error('Create ticket error:', err.response || err);
      toast.error(err.response?.data?.msg || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets based on active tab
  const filteredTickets = React.useMemo(() => {
    console.log('Filtering tickets. Active tab:', activeTab, 'Total tickets:', myTickets.length);
    console.log('All tickets:', myTickets);
    
    const filtered = myTickets.filter(ticket => {
      switch (activeTab) {
        case 'pending':
          return ticket.status === 'pending';
        case 'in-progress':
          return ticket.status === 'in-progress';
        case 'resolved':
          return ticket.status === 'resolved';
        case 'all':
        default:
          return true;
      }
    });
    
    console.log('Filtered tickets:', filtered);
    return filtered;
  }, [myTickets, activeTab]);

  const logout = () => {
    localStorage.clear();
    toast.info('Logged out successfully');
    navigate('/');
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Recently';
    const now = new Date();
    const created = new Date(date);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Function to refresh tickets
  const refreshTickets = () => {
    fetchTickets();
    toast.info('Refreshing tickets...');
  };

  // Debug function to see current state
  const debugState = () => {
    console.log('=== DEBUG INFO ===');
    console.log('User ID:', userId);
    console.log('Active Tab:', activeTab);
    console.log('Total Tickets:', myTickets.length);
    console.log('Ticket Status Breakdown:', {
      pending: myTickets.filter(t => t.status === 'pending').length,
      inProgress: myTickets.filter(t => t.status === 'in-progress').length,
      resolved: myTickets.filter(t => t.status === 'resolved').length
    });
    console.log('All Tickets:', myTickets);
    console.log('Filtered Tickets:', filteredTickets);
    toast.info('Check console for debug info');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo-container">
            <div className="logo-icon">🚀</div>
            <a href="/student" className="logo">MentorQueue</a>
            <span className="logo-tagline">Student Portal</span>
          </div>
          
          <div className="nav-controls">
            <div className="nav-user">
              <div className="user-avatar">
                {userName ? userName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{userName || 'Student'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Student</div>
              </div>
            </div>
            <ThemeToggle />
            <button onClick={logout} className="nav-btn">
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="header-section">
          <div>
            <h1>Welcome back, {userName || 'Student'}! 👋</h1>
            <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Get help from mentors with your coding challenges
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={refreshTickets}
              style={{
                padding: '0.8rem 1.2rem',
                background: 'transparent',
                border: '2px solid var(--primary)',
                color: 'var(--primary)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🔄</span>
              Refresh
            </button>
            <button
              onClick={debugState}
              style={{
                padding: '0.8rem 1.2rem',
                background: 'transparent',
                border: '2px solid var(--warning)',
                color: 'var(--warning)',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'var(--transition)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem'
              }}
            >
              <span>🐛</span>
              Debug
            </button>
            <div className="user-info-card">
              <div className="user-avatar-large">
                {userName ? userName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>{userName || 'Student'}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Student Account</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tickets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ 
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {stats.pending}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ 
              background: 'linear-gradient(90deg, #6366f1, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {stats.inProgress}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ 
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {stats.resolved}
            </div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        {/* Ticket Creation Form */}
        <div className="ticket-form-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🎫</span>
            Create New Support Ticket
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
            Describe your coding issue in detail. A mentor will assist you shortly.
          </p>
          
          <form onSubmit={createTicket}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Issue Title *</label>
                <input 
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 'MongoDB Connection Error in Node.js'"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="form-input"
                  style={{ backgroundColor: 'var(--bg-color)' }}
                >
                  <option>General Coding</option>
                  <option>Frontend Development</option>
                  <option>Backend Development</option>
                  <option>Database Issues</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea 
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail. Include error messages, code snippets, and what you've tried so far..."
                rows="4"
                required
                disabled={loading}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
              <button 
                className="btn-submit" 
                type="submit"
                disabled={loading || !title.trim() || !description.trim()}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  opacity: (!title.trim() || !description.trim()) ? 0.6 : 1 
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner" />
                    Creating Ticket...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Submit Ticket
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTitle('React useEffect Dependency Issue');
                  setDescription('I\'m getting infinite re-renders when using useEffect with my state. Here\'s my code: const [count, setCount] = useState(0); useEffect(() => { setCount(count + 1); }, [count]);');
                }}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: '2px solid var(--border)',
                  color: 'var(--text-light)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <span>✨</span>
                Load Example
              </button>
            </div>
          </form>
        </div>

        {/* Ticket List Section */}
        <div style={{ marginTop: '3rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1.5rem' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>📋</span>
                My Tickets ({filteredTickets.length})
              </h2>
              <div style={{ 
                padding: '4px 8px', 
                background: 'var(--bg-color)', 
                color: 'var(--text-light)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                border: '1px solid var(--border)'
              }}>
                Showing: {activeTab === 'all' ? 'All' : activeTab.replace('-', ' ')}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-color)', padding: '4px', borderRadius: 'var(--radius)' }}>
              {['all', 'pending', 'in-progress', 'resolved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    background: activeTab === tab ? 'var(--primary)' : 'transparent',
                    color: activeTab === tab ? 'white' : 'var(--text-light)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'var(--transition)',
                    textTransform: 'capitalize',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {tab === 'pending' && stats.pending > 0 && (
                    <span style={{
                      background: 'white',
                      color: 'var(--primary)',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {stats.pending}
                    </span>
                  )}
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {activeTab === 'resolved' ? '✅' : '📭'}
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>
                {activeTab === 'resolved' ? 'No resolved tickets yet' : 'No tickets found'}
              </h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                {activeTab === 'all' 
                  ? "You haven't created any tickets yet. Create your first one above!"
                  : activeTab === 'resolved'
                  ? "Your resolved tickets will appear here once mentors help you!"
                  : `No ${activeTab} tickets found.`}
              </p>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  style={{
                    marginTop: '1rem',
                    padding: '10px 20px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius)',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  View All Tickets
                </button>
              )}
            </div>
          ) : (
            <div className="ticket-grid">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className={`ticket-card status-${ticket.status}`}>
                  <div className="ticket-header">
                    <div>
                      <h3 className="ticket-title">{ticket.title}</h3>
                      <div className="ticket-meta">
                        <span className="meta-item">
                          <span>🕒</span>
                          {getTimeAgo(ticket.createdAt)}
                        </span>
                        <span className="meta-item">
                          <span>🆔</span>
                          #{ticket._id ? ticket._id.slice(-6) : 'N/A'}
                        </span>
                        <span className="meta-item">
                          <span>📊</span>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                    <span className={`status-badge badge-${ticket.status}`}>
                      {ticket.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <p className="ticket-desc">{ticket.description}</p>
                  
                  <div className="ticket-footer">
                    <div>
                      {ticket.mentor ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {ticket.mentor.name ? ticket.mentor.name.charAt(0).toUpperCase() : 'M'}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                              {ticket.mentor.name || 'Mentor'}
                              {ticket.status === 'resolved' && ' (Resolved)'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                              {ticket.status === 'resolved' ? 'Issue resolved' : 'Assigned Mentor'}
                            </div>
                          </div>
                        </div>
                      ) : ticket.status === 'pending' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>⏳</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                            Waiting for mentor assignment
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>✅</span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--success)' }}>
                            Ticket resolved successfully
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="btn-action btn-details" 
                      onClick={() => toast.info(`Ticket Details:\nTitle: ${ticket.title}\nStatus: ${ticket.status}\nCreated: ${new Date(ticket.createdAt).toLocaleString()}`)}
                    >
                      <span>👁️</span>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Tickets Summary */}
        {stats.resolved > 0 && activeTab !== 'resolved' && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.1))',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>✅</div>
              <div>
                <div style={{ fontWeight: '600', color: 'var(--success)' }}>
                  You have {stats.resolved} resolved ticket{stats.resolved !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                  Great job on your learning journey!
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('resolved')}
              style={{
                padding: '10px 20px',
                background: 'var(--success)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'var(--transition)'
              }}
            >
              View Resolved Tickets →
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;