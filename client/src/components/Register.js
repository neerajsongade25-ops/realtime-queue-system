import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ThemeToggle from './ThemeToggle'; // Import

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'student' 
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData);
      toast.success('Registration Successful! Please Login.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Registration Failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🚀 Create Account</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            <ThemeToggle />
          Join the mentorship queue system
        </p>

        <form onSubmit={handleSubmit}>
          <input 
            className="form-input"
            type="text" 
            name="name" 
            placeholder="Full Name" 
            onChange={handleChange} 
            required 
          />
          <input 
            className="form-input"
            type="email" 
            name="email" 
            placeholder="Email Address" 
            onChange={handleChange} 
            required 
          />
          <input 
            className="form-input"
            type="password" 
            name="password" 
            placeholder="Choose Password" 
            onChange={handleChange} 
            required 
          />
          
          <div style={{ textAlign: 'left', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151' }}>
            I am a:
          </div>
          <select 
            className="form-input"
            name="role" 
            onChange={handleChange}
            style={{ backgroundColor: 'white' }}
          >
            <option value="student">Student (Asking for help)</option>
            <option value="mentor">Mentor (Giving help)</option>
          </select>

          <button type="submit" className="btn-primary">
            Register Now
          </button>
        </form>

        <p style={{ marginTop: '1rem', color: '#666' }}>
          Already have an account? <Link to="/" style={{ color: '#4f46e5', fontWeight: 'bold' }}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;