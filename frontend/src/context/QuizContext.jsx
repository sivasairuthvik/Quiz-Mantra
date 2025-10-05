import React, { createContext, useContext, useReducer } from 'react';
import { quizAPI } from '../utils/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  quizzes: [],
  currentQuiz: null,
  quizSubmissions: [],
  currentSubmission: null,
  isLoading: false,
  error: null,
  filters: {
    difficulty: '',
    category: '',
    status: '',
    search: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  
  // Quiz actions
  SET_QUIZZES: 'SET_QUIZZES',
  ADD_QUIZ: 'ADD_QUIZ',
  UPDATE_QUIZ: 'UPDATE_QUIZ',
  DELETE_QUIZ: 'DELETE_QUIZ',
  SET_CURRENT_QUIZ: 'SET_CURRENT_QUIZ',
  
  // Submission actions
  SET_SUBMISSIONS: 'SET_SUBMISSIONS',
  ADD_SUBMISSION: 'ADD_SUBMISSION',
  UPDATE_SUBMISSION: 'UPDATE_SUBMISSION',
  SET_CURRENT_SUBMISSION: 'SET_CURRENT_SUBMISSION',
  
  // Filter actions
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  
  // Pagination actions
  SET_PAGINATION: 'SET_PAGINATION',
};

// Reducer
const quizReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case actionTypes.SET_QUIZZES:
      return {
        ...state,
        quizzes: action.payload,
        isLoading: false,
      };

    case actionTypes.ADD_QUIZ:
      return {
        ...state,
        quizzes: [action.payload, ...state.quizzes],
      };

    case actionTypes.UPDATE_QUIZ:
      return {
        ...state,
        quizzes: state.quizzes.map(quiz =>
          quiz._id === action.payload._id ? action.payload : quiz
        ),
        currentQuiz: state.currentQuiz?._id === action.payload._id 
          ? action.payload 
          : state.currentQuiz,
      };

    case actionTypes.DELETE_QUIZ:
      return {
        ...state,
        quizzes: state.quizzes.filter(quiz => quiz._id !== action.payload),
        currentQuiz: state.currentQuiz?._id === action.payload 
          ? null 
          : state.currentQuiz,
      };

    case actionTypes.SET_CURRENT_QUIZ:
      return {
        ...state,
        currentQuiz: action.payload,
      };

    case actionTypes.SET_SUBMISSIONS:
      return {
        ...state,
        quizSubmissions: action.payload,
        isLoading: false,
      };

    case actionTypes.ADD_SUBMISSION:
      return {
        ...state,
        quizSubmissions: [action.payload, ...state.quizSubmissions],
      };

    case actionTypes.UPDATE_SUBMISSION:
      return {
        ...state,
        quizSubmissions: state.quizSubmissions.map(submission =>
          submission._id === action.payload._id ? action.payload : submission
        ),
        currentSubmission: state.currentSubmission?._id === action.payload._id 
          ? action.payload 
          : state.currentSubmission,
      };

    case actionTypes.SET_CURRENT_SUBMISSION:
      return {
        ...state,
        currentSubmission: action.payload,
      };

    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case actionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: initialState.filters,
      };

    case actionTypes.SET_PAGINATION:
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    default:
      return state;
  }
};

// Create context
const QuizContext = createContext();

// Quiz provider component
export const QuizProvider = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  // Utility functions
  const setLoading = (loading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Quiz functions
  const fetchQuizzes = async (params = {}) => {
    try {
      setLoading(true);
      const response = await quizAPI.getQuizzes(params);
      
      if (response.data.success) {
        dispatch({ type: actionTypes.SET_QUIZZES, payload: response.data.data });
        
        // Update pagination if provided
        if (response.data.pagination) {
          dispatch({ 
            type: actionTypes.SET_PAGINATION, 
            payload: response.data.pagination 
          });
        }
        
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Fetch quizzes error:', error);
      setError(error.response?.data?.message || 'Failed to fetch quizzes');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizById = async (id) => {
    try {
      setLoading(true);
      const response = await quizAPI.getQuiz(id);
      
      if (response.data.success) {
        dispatch({ type: actionTypes.SET_CURRENT_QUIZ, payload: response.data.data });
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Fetch quiz error:', error);
      setError(error.response?.data?.message || 'Failed to fetch quiz');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  const getQuiz = async (id) => {
    const result = await fetchQuizById(id);
    if (result.success) return result.data;
    throw new Error(result.error || 'Failed to get quiz');
  };

  const createQuiz = async (quizData) => {
    try {
      setLoading(true);
      const response = await quizAPI.createQuiz(quizData);
      
      if (response.data.success) {
        dispatch({ type: actionTypes.ADD_QUIZ, payload: response.data.data });
        toast.success('Quiz created successfully!');
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Create quiz error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create quiz';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateQuiz = async (id, quizData) => {
    try {
      setLoading(true);
      const response = await quizAPI.updateQuiz(id, quizData);
      
      if (response.data.success) {
        dispatch({ type: actionTypes.UPDATE_QUIZ, payload: response.data.data });
        toast.success('Quiz updated successfully!');
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Update quiz error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update quiz';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateQuizStatus = async (id, status) => {
    return updateQuiz(id, { status });
  };

  const deleteQuiz = async (id) => {
    try {
      setLoading(true);
      const response = await quizAPI.deleteQuiz(id);
      
      if (response.data.success) {
        dispatch({ type: actionTypes.DELETE_QUIZ, payload: id });
        toast.success('Quiz deleted successfully!');
        return { success: true };
      }
    } catch (error) {
      console.error('Delete quiz error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete quiz';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const generateQuizQuestions = async (params) => {
    try {
      setLoading(true);
      const response = await quizAPI.generateQuestions(params);
      
      if (response.data.success) {
        toast.success('Questions generated successfully!');
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Generate questions error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate questions';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Submission functions
  const fetchSubmissions = async (params = {}) => {
    try {
      setLoading(true);
      const response = await quizAPI.getSubmissions(params);
      
      if (response.data.success) {
        dispatch({ type: actionTypes.SET_SUBMISSIONS, payload: response.data.data });
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Fetch submissions error:', error);
      setError(error.response?.data?.message || 'Failed to fetch submissions');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const submitQuiz = async (quizId, answers) => {
    try {
      setLoading(true);
      const response = await quizAPI.submitQuiz(quizId, { answers });
      
      if (response.data.success) {
        dispatch({ type: actionTypes.ADD_SUBMISSION, payload: response.data.data });
        toast.success('Quiz submitted successfully!');
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Submit quiz error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit quiz';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionById = async (id) => {
    try {
      setLoading(true);
      const response = await quizAPI.getSubmissionById(id);
      
      if (response.data.success) {
        dispatch({ type: actionTypes.SET_CURRENT_SUBMISSION, payload: response.data.data });
        return { success: true, data: response.data.data };
      }
    } catch (error) {
      console.error('Fetch submission error:', error);
      setError(error.response?.data?.message || 'Failed to fetch submission');
      return { success: false, error: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // Filter and pagination functions
  const setFilters = (filters) => {
    dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
  };

  const resetFilters = () => {
    dispatch({ type: actionTypes.RESET_FILTERS });
  };

  const setPagination = (paginationData) => {
    dispatch({ type: actionTypes.SET_PAGINATION, payload: paginationData });
  };

  const value = {
    // State
    ...state,
    isLoading: state.isLoading,
    loading: state.isLoading,
    
    // Quiz actions
    fetchQuizzes,
    fetchQuizById,
    getQuiz,
    createQuiz,
    updateQuiz,
    updateQuizStatus,
    deleteQuiz,
    
    // Submission actions
    fetchSubmissions,
    submitQuiz,
    fetchSubmissionById,
    
    // Filter and pagination actions
    setFilters,
    resetFilters,
    setPagination,
    
    // Utility actions
    setLoading,
    setError,
    clearError,
  };

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use quiz context
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export default QuizContext;