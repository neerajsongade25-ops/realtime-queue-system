import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

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
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="name" 
          placeholder="Full Name" 
          onChange={handleChange} 
          required 
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          onChange={handleChange} 
          required 
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={handleChange} 
          required 
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
        <select 
          name="role" 
          onChange={handleChange} 
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        >
          <option value="student">Student</option>
          <option value="mentor">Mentor</option>
        </select>
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Register</button>
      </form>
      <p>Already have an account? <Link to="/">Login here</Link></p>
    </div>
  );
};

export default Register;