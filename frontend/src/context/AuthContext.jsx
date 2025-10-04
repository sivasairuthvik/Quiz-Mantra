import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { storage } from '../utils/helpers';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case actionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case actionTypes.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case actionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case actionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = storage.get('token');
        const user = storage.get('user');

        if (token && user) {
          // Verify token is still valid
          const response = await authAPI.getMe();
          if (response.data.success) {
            dispatch({
              type: actionTypes.LOGIN_SUCCESS,
              payload: {
                user: response.data.data,
                token,
              },
            });
          } else {
            // Token is invalid, clear storage
            storage.remove('token');
            storage.remove('user');
            dispatch({ type: actionTypes.SET_LOADING, payload: false });
          }
        } else {
          dispatch({ type: actionTypes.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        storage.remove('token');
        storage.remove('user');
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (token, user) => {
    try {
      // Store in localStorage
      storage.set('token', token);
      storage.set('user', user);

      dispatch({
        type: actionTypes.LOGIN_SUCCESS,
        payload: { token, user },
      });

      toast.success(`Welcome back, ${user.name}!`);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      dispatch({
        type: actionTypes.LOGIN_FAILURE,
        payload: 'Login failed. Please try again.',
      });
      return { success: false, error: 'Login failed' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear storage regardless of API call success
      storage.remove('token');
      storage.remove('user');
      dispatch({ type: actionTypes.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const response = await authAPI.updateProfile(userData);
      if (response.data.success) {
        const updatedUser = response.data.data;
        storage.set('user', updatedUser);
        dispatch({
          type: actionTypes.UPDATE_USER,
          payload: updatedUser,
        });
        toast.success('Profile updated successfully');
        return { success: true, user: updatedUser };
      }
    } catch (error) {
      console.error('Update user error:', error);
      toast.error('Failed to update profile');
      return { success: false, error: error.response?.data?.message || 'Update failed' };
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      const response = await authAPI.deleteAccount();
      if (response.data.success) {
        storage.clear();
        dispatch({ type: actionTypes.LOGOUT });
        toast.success('Account deleted successfully');
        return { success: true };
      }
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Failed to delete account');
      return { success: false, error: error.response?.data?.message || 'Delete failed' };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Check if user has permission
  const hasPermission = (requiredRoles) => {
    if (!state.user) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(state.user.role);
    }
    return state.user.role === requiredRoles;
  };

  // Get user role
  const getUserRole = () => {
    return state.user?.role || null;
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  // Check if user is teacher
  const isTeacher = () => {
    return state.user?.role === 'teacher';
  };

  // Check if user is student
  const isStudent = () => {
    return state.user?.role === 'student';
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout,
    updateUser,
    deleteAccount,
    clearError,
    
    // Utilities
    hasPermission,
    getUserRole,
    isAdmin,
    isTeacher,
    isStudent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;