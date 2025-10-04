import React, { forwardRef, useState } from 'react';
import './Input.css';

const Input = forwardRef(({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  variant = 'default',
  icon,
  iconPosition = 'left',
  clearable = false,
  className = '',
  containerClassName = '',
  id,
  name,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  min,
  max,
  step,
  rows = 3,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isTextarea = type === 'textarea';
  const isPassword = type === 'password';

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleClear = () => {
    if (onChange) {
      const event = {
        target: { name, value: '' }
      };
      onChange(event);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputClasses = [
    'input__field',
    `input__field--${size}`,
    `input__field--${variant}`,
    error && 'input__field--error',
    disabled && 'input__field--disabled',
    isFocused && 'input__field--focused',
    icon && `input__field--icon-${iconPosition}`,
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'input',
    containerClassName
  ].filter(Boolean).join(' ');

  const InputComponent = isTextarea ? 'textarea' : 'input';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const inputProps = {
    ref,
    id: inputId,
    name,
    type: isTextarea ? undefined : inputType,
    value,
    onChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder,
    required,
    disabled,
    readOnly,
    autoComplete,
    maxLength,
    minLength,
    pattern,
    min,
    max,
    step,
    className: inputClasses,
    'aria-invalid': error ? 'true' : 'false',
    'aria-describedby': error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined,
    ...(isTextarea && { rows }),
    ...props
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
          {required && <span className="input__required">*</span>}
        </label>
      )}

      <div className="input__wrapper">
        {icon && iconPosition === 'left' && (
          <span className="input__icon input__icon--left">
            {icon}
          </span>
        )}

        <InputComponent {...inputProps} />

        {(clearable && value && !disabled && !readOnly) && (
          <button
            type="button"
            className="input__clear"
            onClick={handleClear}
            aria-label="Clear input"
          >
            ✕
          </button>
        )}

        {isPassword && (
          <button
            type="button"
            className="input__password-toggle"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        )}

        {icon && iconPosition === 'right' && !clearable && !isPassword && (
          <span className="input__icon input__icon--right">
            {icon}
          </span>
        )}
      </div>

      {error && (
        <span id={`${inputId}-error`} className="input__error">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span id={`${inputId}-helper`} className="input__helper">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Select component
export const Select = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  error,
  helperText,
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  containerClassName = '',
  id,
  name,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = [
    'select__field',
    `select__field--${size}`,
    error && 'select__field--error',
    disabled && 'select__field--disabled',
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'select',
    containerClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={selectId} className="select__label">
          {label}
          {required && <span className="select__required">*</span>}
        </label>
      )}

      <div className="select__wrapper">
        <select
          ref={ref}
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={selectClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="select__chevron">▼</span>
      </div>

      {error && (
        <span id={`${selectId}-error`} className="select__error">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span id={`${selectId}-helper`} className="select__helper">
          {helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Checkbox component
export const Checkbox = forwardRef(({
  label,
  checked,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  size = 'md',
  className = '',
  containerClassName = '',
  id,
  name,
  value,
  ...props
}, ref) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const checkboxClasses = [
    'checkbox__input',
    `checkbox__input--${size}`,
    error && 'checkbox__input--error',
    disabled && 'checkbox__input--disabled',
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'checkbox',
    containerClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <div className="checkbox__wrapper">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={checkboxClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined}
          {...props}
        />
        <label htmlFor={checkboxId} className="checkbox__label">
          <span className="checkbox__box">
            <span className="checkbox__check">✓</span>
          </span>
          {label && (
            <span className="checkbox__text">
              {label}
              {required && <span className="checkbox__required">*</span>}
            </span>
          )}
        </label>
      </div>

      {error && (
        <span id={`${checkboxId}-error`} className="checkbox__error">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span id={`${checkboxId}-helper`} className="checkbox__helper">
          {helperText}
        </span>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Input;