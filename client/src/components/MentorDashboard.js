import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const MentorDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });
  const [myActiveTickets, setMyActiveTickets] = useState([]);
  const navigate = useNavigate();

  const mentorId = localStorage.getItem('userId');
  const mentorName = localStorage.getItem('userName');

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    socket.on('new_ticket', (ticket) => {
      setTickets((prev) => [ticket, ...prev]);
      toast.info(`🔔 New Ticket: "${ticket.title}" from ${ticket.student?.name}`);
      updateStats([ticket, ...tickets]);
    });

    socket.on('ticket_updated', (updatedTicket) => {
      setTickets((prev) => prev.map((t) => t._id === updatedTicket._id ? updatedTicket : t));
      updateStats(tickets);
      
      if (updatedTicket.mentor?._id === mentorId) {
        if (updatedTicket.status === 'resolved') {
          toast.success(`✅ You resolved: ${updatedTicket.title}`);
        }
      }
    });

    socket.on('ticket_claimed', ({ ticketId, mentorName }) => {
      toast.info(`👨‍🏫 ${mentorName} claimed a ticket`);
    });

    return () => {
      socket.off('new_ticket');
      socket.off('ticket_updated');
      socket.off('ticket_claimed');
    };
  }, [mentorId, tickets]);

  const fetchTickets = async () => {
  try {
    setLoading(true);
    const res = await axios.get('http://localhost:5000/api/tickets');
    setTickets(res.data);
    updateStats(res.data);
    updateMyActiveTickets(res.data);
  } catch (err) {
    console.error('Fetch tickets error:', err);
    toast.error('Failed to load tickets');
  } finally {
    setLoading(false);
  }
};

  const updateStats = (ticketList) => {
    const pending = ticketList.filter(t => t.status === 'pending').length;
    const inProgress = ticketList.filter(t => t.status === 'in-progress').length;
    const resolved = ticketList.filter(t => t.status === 'resolved').length;
    
    setStats({
      pending,
      inProgress,
      resolved,
      total: ticketList.length
    });
  };

  const updateMyActiveTickets = (ticketList) => {
    const myTickets = ticketList.filter(t => 
      t.mentor?._id === mentorId && t.status === 'in-progress'
    );
    setMyActiveTickets(myTickets);
  };

  // Update the handleAction function:
const handleAction = async (ticketId, status) => {
  try {
    const mentorId = localStorage.getItem('userId');
    const res = await axios.patch(
      `http://localhost:5000/api/tickets/${ticketId}`,
      { status, mentorId }
    );

    if (status === 'in-progress') {
      toast.success(`🎯 You claimed: "${res.data.title}"`);
    } else {
      toast.success(`✅ Ticket marked as resolved`);
    }

    setTickets(prev => prev.map(t => t._id === ticketId ? res.data : t));
    updateMyActiveTickets(tickets);
    
  } catch (err) {
    console.error('Handle action error:', err);
    toast.error(err.response?.data?.msg || 'Action failed');
  }
};

  const filteredTickets = tickets.filter(ticket => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pending') return ticket.status === 'pending';
    if (activeFilter === 'in-progress') return ticket.status === 'in-progress';
    if (activeFilter === 'resolved') return ticket.status === 'resolved';
    if (activeFilter === 'my-tickets') return ticket.mentor?._id === mentorId;
    return true;
  });

  const getTimeAgo = (date) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const getPriorityColor = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursOld = (now - created) / (1000 * 60 * 60);
    
    if (hoursOld > 4) return '#ef4444'; // High priority - red
    if (hoursOld > 2) return '#f59e0b'; // Medium priority - orange
    return '#10b981'; // Low priority - green
  };

  const logout = () => {
    localStorage.clear();
    toast.info('Logged out successfully');
    navigate('/');
  };

  const refreshTickets = () => {
    fetchTickets();
    toast.info('Refreshing ticket list...');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo-container">
            <div className="logo-icon">🚀</div>
            <a href="/mentor" className="logo">MentorQueue</a>
            <span className="logo-tagline">Mentor Portal</span>
          </div>
          
          <div className="nav-controls">
            <div className="nav-user">
              <div className="user-avatar">
                {mentorName ? mentorName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{mentorName || 'Mentor'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Mentor</div>
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
        {/* Header Section */}
        <div className="header-section">
          <div>
            <h1>Welcome, {mentorName || 'Mentor'}! 👨‍🏫</h1>
            <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Help students with their coding challenges in real-time
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
            
            <div className="user-info-card">
              <div className="user-avatar-large">
                {mentorName ? mentorName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <div style={{ fontWeight: '600' }}>{mentorName || 'Mentor'}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                  {myActiveTickets.length} active tickets
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
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
            <div className="stat-label">Awaiting Help</div>
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
            <div className="stat-label">Resolved Today</div>
          </div>
        </div>

        {/* Ticket Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          margin: '2rem 0 1.5rem 0',
          padding: '0.5rem',
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span>
              Support Queue ({filteredTickets.length})
            </h3>
            
            <div style={{ 
              padding: '4px 8px', 
              background: 'var(--primary)', 
              color: 'white',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              Live
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Tickets', icon: '📋' },
              { id: 'pending', label: 'Pending', icon: '⏳' },
              { id: 'in-progress', label: 'In Progress', icon: '⚡' },
              { id: 'resolved', label: 'Resolved', icon: '✅' },
              { id: 'my-tickets', label: 'My Tickets', icon: '👤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                style={{
                  padding: '8px 16px',
                  background: activeFilter === tab.id ? 'var(--primary)' : 'transparent',
                  color: activeFilter === tab.id ? 'white' : 'var(--text-light)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'var(--transition)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === 'pending' && stats.pending > 0 && (
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
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
            gap: '2rem',
            marginTop: '2rem'
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="loading-shimmer" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {activeFilter === 'pending' ? '🎉' : '📭'}
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>
              {activeFilter === 'pending' ? 'No pending tickets!' : 'No tickets found'}
            </h3>
            <p style={{ color: 'var(--text-light)' }}>
              {activeFilter === 'pending' 
                ? 'All tickets are currently being handled or resolved. Great job!'
                : `No ${activeFilter.replace('-', ' ')} tickets found.`}
            </p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
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
                <div style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getPriorityColor(ticket.createdAt)
                }} />
                
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
                        #{ticket._id.slice(-6)}
                      </span>
                    </div>
                  </div>
                  <span className={`status-badge badge-${ticket.status}`}>
                    {ticket.status.replace('-', ' ')}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  marginBottom: '1rem',
                  padding: '0.8rem',
                  background: 'var(--bg-color)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {ticket.student?.name?.charAt(0).toUpperCase() || 'S'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {ticket.student?.name || 'Anonymous Student'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                      Needs help with {ticket.category || 'coding issue'}
                    </div>
                  </div>
                </div>
                
                <p className="ticket-desc">
                  {ticket.description.length > 150 
                    ? `${ticket.description.substring(0, 150)}...` 
                    : ticket.description
                  }
                </p>
                
                {ticket.mentor && ticket.status === 'in-progress' && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    margin: '1rem 0',
                    padding: '0.8rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.1))',
                    borderRadius: 'var(--radius)',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold'
                    }}>
                      {ticket.mentor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        Assigned to {ticket.mentor.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                        {ticket.mentor._id === mentorId ? 'You are helping' : 'Another mentor'}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="ticket-footer">
                  {ticket.status === 'pending' && (
                    <button 
                      onClick={() => handleAction(ticket._id, 'in-progress')}
                      className="btn-action btn-claim"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>✋</span>
                      Claim Ticket
                    </button>
                  )}
                  
                  {ticket.status === 'in-progress' && ticket.mentor?._id === mentorId && (
                    <button 
                      onClick={() => handleAction(ticket._id, 'resolved')}
                      className="btn-action btn-resolve"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <span>✅</span>
                      Mark as Resolved
                    </button>
                  )}
                  
                  {ticket.status === 'in-progress' && ticket.mentor?._id !== mentorId && (
                    <div style={{ 
                      padding: '10px', 
                      background: 'var(--bg-color)', 
                      color: 'var(--text-light)',
                      borderRadius: 'var(--radius)',
                      textAlign: 'center',
                      fontSize: '0.9rem'
                    }}>
                      Assigned to {ticket.mentor?.name}
                    </div>
                  )}
                  
                  {ticket.status === 'resolved' && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      width: '100%'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>✨</span>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--success)' }}>Resolved</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            by {ticket.mentor?.name || 'Mentor'}
                          </div>
                        </div>
                      </div>
                      <button className="btn-action btn-details">
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats Footer */}
        <div style={{ 
          marginTop: '3rem', 
          padding: '1.5rem', 
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
              Your Mentoring Stats
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
                  {myActiveTickets.length}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Active</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success)' }}>
                  {tickets.filter(t => t.mentor?._id === mentorId && t.status === 'resolved').length}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Resolved</div>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
              Queue Status
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: stats.pending > 3 ? 'var(--warning)' : 'var(--success)' }}>
              {stats.pending > 3 ? 'High Load' : 'Normal Load'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              {stats.pending} tickets waiting
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MentorDashboard;