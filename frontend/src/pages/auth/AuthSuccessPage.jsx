import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    let user = null;
    try {
      user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
    } catch {
      user = null;
    }
    if (token && user) {
      login(token, user);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, login, navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h2>Authenticating...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
};

export default AuthSuccessPage;
