import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Card } from '../../components/common';
import './LoginPage.css';

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would redirect to Google OAuth
      // For now, we'll simulate a login
      window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  // Handle OAuth callback (this would be called when redirected back from Google)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userString = urlParams.get('user');

    if (token && userString) {
      try {
        const user = JSON.parse(decodeURIComponent(userString));
        login(token, user);
        navigate(from, { replace: true });
      } catch (error) {
        console.error('OAuth callback error:', error);
      }
    }
  }, [login, navigate, from]);

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="login-page">
      <div className="login-page__background">
        <div className="login-page__pattern"></div>
      </div>
      
      <div className="login-page__container">
        <div className="login-page__content">
          
          {/* Logo and branding */}
          <div className="login-page__header">
            <div className="login-page__logo">
              <h1>Quiz Mantra</h1>
              <p>AI-Powered Quiz Management System</p>
            </div>
          </div>

          {/* Login card */}
          <Card className="login-page__card">
            <div className="login-card">
              <div className="login-card__header">
                <h2>Welcome Back</h2>
                <p>Sign in to access your quiz dashboard</p>
              </div>

              <div className="login-card__content">
                <Button
                  onClick={handleGoogleLogin}
                  loading={isLoading}
                  size="lg"
                  fullWidth
                  icon="🚀"
                  className="login-card__google-btn"
                >
                  Continue with Google
                </Button>

                <div className="login-card__divider">
                  <span>or</span>
                </div>

                <div className="login-card__demo">
                  <h3>Demo Accounts</h3>
                  <p>For testing purposes, use these demo accounts:</p>
                  
                  <div className="demo-accounts">
                    <div className="demo-account">
                      <strong>Student:</strong> student@demo.com
                    </div>
                    <div className="demo-account">
                      <strong>Teacher:</strong> teacher@demo.com
                    </div>
                    <div className="demo-account">
                      <strong>Admin:</strong> admin@demo.com
                    </div>
                  </div>
                </div>
              </div>

              <div className="login-card__footer">
                <p>
                  By signing in, you agree to our{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </Card>

          {/* Features showcase */}
          <div className="login-page__features">
            <h3>Why Choose Quiz Mantra?</h3>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">🤖</div>
                <h4>AI-Powered</h4>
                <p>Generate quiz questions automatically using advanced AI</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <h4>Analytics</h4>
                <p>Detailed insights and performance tracking</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🏆</div>
                <h4>Competitions</h4>
                <p>Engage students with quiz competitions</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📱</div>
                <h4>Mobile Friendly</h4>
                <p>Access from any device, anywhere</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;