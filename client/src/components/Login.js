import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ThemeToggle from './ThemeToggle';

const Login = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('userName', res.data.user.name);

      toast.success(`🎉 Welcome back, ${res.data.user.name}!`);
      
      setTimeout(() => {
        navigate(res.data.user.role === 'student' ? '/student' : '/mentor');
      }, 1000);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const useDemoCredentials = (role) => {
    const credentials = role === 'student' 
      ? { email: 'student@demo.com', password: 'demo123' }
      : { email: 'mentor@demo.com', password: 'demo123' };
    
    setFormData(credentials);
    toast.info(`🔑 ${role.charAt(0).toUpperCase() + role.slice(1)} demo credentials loaded`);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ marginBottom: '2rem' }}>
          <div className="logo-container" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <div className="logo-icon">🚀</div>
            <h1 style={{ fontSize: '1.8rem' }} className="logo">MentorQueue</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your mentorship dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <span style={{ marginRight: '8px' }}>✉️</span>
              Email Address
            </label>
            <input 
              className="form-input"
              type="email" 
              name="email" 
              placeholder="Enter your email address"
              value={formData.email}
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
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input"
                type={showPassword ? "text" : "password"}
                name="password" 
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange} 
                required 
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-light)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => toast.info('Contact admin to reset your password')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'underline'
              }}
            >
              Forgot Password?
            </button>
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
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <span>→</span>
              </>
            )}
          </button>
        </form>

        <div className="demo-credentials">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👥</span>
            Demo Access
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
            Try out the system with demo accounts
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => useDemoCredentials('student')}
              style={{
                flex: 1,
                padding: '0.8rem',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'var(--transition)',
                fontSize: '0.9rem'
              }}
            >
              Student Demo
            </button>
            
            <button
              onClick={() => useDemoCredentials('mentor')}
              style={{
                flex: 1,
                padding: '0.8rem',
                background: 'linear-gradient(135deg, #10b981, #34d399)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'var(--transition)',
                fontSize: '0.9rem'
              }}
            >
              Mentor Demo
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <ThemeToggle />
            <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              v1.0.0
            </div>
          </div>
          
          <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
            New to MentorQueue?{' '}
            <Link to="/register" className="auth-link">
              Create an account
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

export default Login;