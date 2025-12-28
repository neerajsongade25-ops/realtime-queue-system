import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ThemeToggle from './ThemeToggle';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'student' 
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      toast.success('🎉 Registration Successful! Please login to continue.');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ marginBottom: '2rem' }}>
          <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="logo-icon">🚀</div>
            <h1 style={{ fontSize: '1.8rem' }} className="logo">MentorQueue</h1>
          </div>
          <h2>Create Your Account</h2>
          <p>Join our mentorship community and accelerate your learning journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <span style={{ marginRight: '8px' }}>👤</span>
              Full Name
            </label>
            <input 
              className="form-input"
              type="text" 
              name="name" 
              placeholder="Enter your full name" 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{ marginRight: '8px' }}>✉️</span>
              Email Address
            </label>
            <input 
              className="form-input"
              type="email" 
              name="email" 
              placeholder="Enter your email" 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{ marginRight: '8px' }}>🔒</span>
              Password
            </label>
            <input 
              className="form-input"
              type="password" 
              name="password" 
              placeholder="Create a strong password" 
              onChange={handleChange} 
              required 
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span style={{ marginRight: '8px' }}>👥</span>
              I want to join as a:
            </label>
            <div className="role-selection">
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'student'})}
                className={`role-btn student ${formData.role === 'student' ? 'active' : ''}`}
              >
                <span className="role-icon">📚</span>
                <div className="role-name">Student</div>
                <div className="role-desc">Get help with coding</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'mentor'})}
                className={`role-btn mentor ${formData.role === 'mentor' ? 'active' : ''}`}
              >
                <span className="role-icon">👨‍🏫</span>
                <div className="role-name">Mentor</div>
                <div className="role-desc">Help others learn</div>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" style={{
                  width: '20px',
                  height: '20px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <span>→</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <ThemeToggle />
          <p style={{ marginTop: '1rem' }}>
            Already have an account?{' '}
            <Link to="/" className="auth-link">
              Sign in here
            </Link>
          </p>
        </div>

        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default Register;