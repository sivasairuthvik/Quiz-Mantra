import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/common';
import './NotFoundPage.css';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-illustration">
          <div className="not-found-number">404</div>
          <div className="not-found-icon">🔍</div>
        </div>
        
        <Card className="not-found-card">
          <div className="not-found-text">
            <h1>Page Not Found</h1>
            <p>
              Oops! The page you're looking for doesn't exist. 
              It might have been moved, deleted, or you entered the wrong URL.
            </p>
            
            <div className="not-found-actions">
              <Button as={Link} to="/dashboard" variant="primary" size="lg">
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                size="lg"
              >
                Go Back
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotFoundPage;