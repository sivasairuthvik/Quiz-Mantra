import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError('Access denied. Only admins can log in here.');
      }
    }
  }, [user, navigate]);

  return (
    <div className="admin-login-page">
      <h2>Admin Login</h2>
      <p>Login with your admin Google account to access the dashboard.</p>
      <a
        className="google-login-btn"
        href={window.location.origin.includes('5000') ? '/auth/google/admin' : '/api/auth/google/admin'}
      >
        Login with Google
      </a>
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
};

export default AdminLoginPage;
