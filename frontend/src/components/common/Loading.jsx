import React from 'react';
import './Loading.css';

const Loading = ({ 
  size = 'md', 
  color = 'primary', 
  text,
  fullScreen = false,
  className = '',
  ...props 
}) => {
  const loadingClasses = [
    'loading',
    `loading--${size}`,
    `loading--${color}`,
    fullScreen && 'loading--fullscreen',
    className
  ].filter(Boolean).join(' ');

  const LoadingComponent = fullScreen ? 'div' : 'span';

  return (
    <LoadingComponent className={loadingClasses} {...props}>
      <div className="loading__spinner">
        <div className="loading__dot loading__dot--1"></div>
        <div className="loading__dot loading__dot--2"></div>
        <div className="loading__dot loading__dot--3"></div>
      </div>
      {text && <span className="loading__text">{text}</span>}
    </LoadingComponent>
  );
};

// Skeleton Loading Component
export const Skeleton = ({ 
  width, 
  height, 
  variant = 'rectangular',
  className = '',
  ...props 
}) => {
  const style = {
    width,
    height
  };

  return (
    <div 
      className={`skeleton skeleton--${variant} ${className}`}
      style={style}
      {...props}
    />
  );
};

// Card Skeleton
export const CardSkeleton = ({ showAvatar = false, lines = 3 }) => {
  return (
    <div className="card-skeleton">
      <div className="card-skeleton__header">
        {showAvatar && <Skeleton variant="circular" width="40px" height="40px" />}
        <div className="card-skeleton__title-area">
          <Skeleton width="60%" height="20px" />
          <Skeleton width="40%" height="16px" />
        </div>
      </div>
      <div className="card-skeleton__content">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton 
            key={index}
            width={index === lines - 1 ? "70%" : "100%"}
            height="16px"
          />
        ))}
      </div>
    </div>
  );
};

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="table-skeleton">
      <div className="table-skeleton__header">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="100%" height="20px" />
        ))}
      </div>
      <div className="table-skeleton__body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="table-skeleton__row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} width="100%" height="16px" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Page Loading (fullscreen with backdrop)
export const PageLoading = ({ text = "Loading..." }) => {
  return (
    <div className="page-loading">
      <div className="page-loading__backdrop"></div>
      <div className="page-loading__content">
        <Loading size="lg" color="primary" />
        <p className="page-loading__text">{text}</p>
      </div>
    </div>
  );
};

export default Loading;