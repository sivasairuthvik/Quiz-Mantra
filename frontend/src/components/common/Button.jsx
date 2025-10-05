import React from 'react';
import './Button.css';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    loading && 'btn--loading',
    fullWidth && 'btn--full-width',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  // Runtime guard: throw error if icon is a plain object (not string/number/element)
  if (icon && typeof icon === 'object' && !React.isValidElement(icon)) {
    throw new Error(
      'Button icon prop must be a string, number, or valid React element. You passed an object: ' + JSON.stringify(icon)
    );
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      type={type}
      {...props}
    >
      {loading && <span className="btn__spinner"></span>}
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn__icon btn__icon--left">
          {typeof icon === 'string' || typeof icon === 'number' ? icon : React.isValidElement(icon) ? icon : null}
        </span>
      )}
      <span className="btn__text">{children}</span>
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn__icon btn__icon--right">
          {typeof icon === 'string' || typeof icon === 'number' ? icon : React.isValidElement(icon) ? icon : null}
        </span>
      )}
    </button>
  );
};

// Icon Button variant
export const IconButton = ({
  icon,
  children,
  tooltip,
  variant = 'ghost',
  size = 'md',
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className="btn--icon-only"
      title={tooltip}
      {...props}
    >
      {icon}
      {children && <span className="sr-only">{children}</span>}
    </Button>
  );
};

// Button Group component
export const ButtonGroup = ({ children, className = '', ...props }) => {
  return (
    <div className={`btn-group ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Button;