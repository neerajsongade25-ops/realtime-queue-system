import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('userId', res.data.user.id);
      localStorage.setItem('userName', res.data.user.name);

      toast.success('Welcome back!');
      navigate(res.data.user.role === 'student' ? '/student' : '/mentor');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Login Failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>👋 Welcome Back</h2>
        <form onSubmit={handleSubmit}>
          <input className="form-input" type="email" name="email" placeholder="Email Address" onChange={handleChange} required />
          <input className="form-input" type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <button className="btn-primary" type="submit">Login</button>
        </form>
        <p style={{ marginTop: '1rem', color: '#666' }}>
          New here? <Link to="/register" style={{ color: '#4f46e5' }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;