import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import './RegisterPage.css';
import PublicNavbar from '../../components/layout/PublicNavbar';

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleGoogleRegister = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <>
      <PublicNavbar />
      <section className="register-page" aria-label="Register">
        <div className="register-page__container">
          <Card className="register-card">
            <div className="register-card__header">
              <h2>Create your account</h2>
              <p>Join Quiz Mantra to start creating and taking quizzes.</p>
            </div>

            <div className="register-card__content">
              <Button onClick={handleGoogleRegister} size="lg" fullWidth icon="✨">
                Continue with Google
              </Button>
            </div>

            <div className="register-card__footer">
              <p>
                Already have an account?{' '}
                <Button variant="link" onClick={() => navigate('/login')}>Log in</Button>
              </p>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};

export default RegisterPage;
