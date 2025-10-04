import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '', 
  title,
  subtitle,
  headerAction,
  footer,
  padding = 'default',
  shadow = 'default',
  hover = false,
  onClick,
  ...props 
}) => {
  const cardClasses = [
    'card',
    `card--padding-${padding}`,
    `card--shadow-${shadow}`,
    hover && 'card--hover',
    onClick && 'card--clickable',
    className
  ].filter(Boolean).join(' ');

  const CardComponent = onClick ? 'button' : 'div';

  return (
    <CardComponent 
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {headerAction && (
            <div className="card__header-action">
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      <div className="card__content">
        {children}
      </div>
      
      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </CardComponent>
  );
};

// Pre-styled card variants
export const StatsCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color = 'blue',
  ...props 
}) => (
  <Card className={`stats-card stats-card--${color}`} hover {...props}>
    <div className="stats-card__content">
      <div className="stats-card__info">
        <p className="stats-card__title">{title}</p>
        <h3 className="stats-card__value">{value}</h3>
        {trend && (
          <div className={`stats-card__trend stats-card__trend--${trend}`}>
            <span className="stats-card__trend-icon">
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
            <span className="stats-card__trend-value">{trendValue}</span>
          </div>
        )}
      </div>
      {icon && (
        <div className="stats-card__icon">
          {icon}
        </div>
      )}
    </div>
  </Card>
);

export const QuizCard = ({ 
  quiz, 
  onStart, 
  onEdit, 
  onDelete, 
  onView,
  showActions = true,
  userRole = 'student'
}) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'green';
      case 'medium': return 'orange';
      case 'hard': return 'red';
      default: return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'draft': return 'gray';
      case 'archived': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Card className="quiz-card" hover>
      <div className="quiz-card__header">
        <h4 className="quiz-card__title">{quiz.title}</h4>
        <div className="quiz-card__badges">
          <span className={`badge badge--${getDifficultyColor(quiz.difficulty)}`}>
            {quiz.difficulty}
          </span>
          <span className={`badge badge--${getStatusColor(quiz.status)}`}>
            {quiz.status}
          </span>
        </div>
      </div>

      <div className="quiz-card__content">
        {quiz.description && (
          <p className="quiz-card__description">{quiz.description}</p>
        )}
        
        <div className="quiz-card__meta">
          <div className="quiz-card__meta-item">
            <span className="quiz-card__meta-label">Questions:</span>
            <span className="quiz-card__meta-value">{quiz.questions?.length || 0}</span>
          </div>
          <div className="quiz-card__meta-item">
            <span className="quiz-card__meta-label">Duration:</span>
            <span className="quiz-card__meta-value">{quiz.timeLimit} min</span>
          </div>
          <div className="quiz-card__meta-item">
            <span className="quiz-card__meta-label">Category:</span>
            <span className="quiz-card__meta-value">{quiz.category}</span>
          </div>
        </div>

        {quiz.createdBy && (
          <div className="quiz-card__author">
            <span>By: {quiz.createdBy.name}</span>
          </div>
        )}
      </div>

      {showActions && (
        <div className="quiz-card__actions">
          {userRole === 'student' && (
            <button 
              className="btn btn--primary btn--sm"
              onClick={() => onStart?.(quiz)}
            >
              Start Quiz
            </button>
          )}
          
          {(userRole === 'teacher' || userRole === 'admin') && (
            <>
              <button 
                className="btn btn--outline btn--sm"
                onClick={() => onView?.(quiz)}
              >
                View
              </button>
              <button 
                className="btn btn--outline btn--sm"
                onClick={() => onEdit?.(quiz)}
              >
                Edit
              </button>
              <button 
                className="btn btn--danger btn--sm"
                onClick={() => onDelete?.(quiz)}
              >
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default Card;