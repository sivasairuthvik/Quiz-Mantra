import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Button, Input, Loading, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';
import { toast } from 'react-hot-toast';
import styles from './CreateQuizPage.module.css';

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple-choice',
  TRUE_FALSE: 'true-false',
  SHORT_ANSWER: 'short-answer',
  ESSAY: 'essay'
};

const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

export default function CreateQuizPage() {
  const { user } = useAuth();
  const { createQuiz, updateQuiz, getQuiz, loading } = useQuiz();
  const navigate = useNavigate();
  const { id } = useParams(); // For editing existing quiz
  const isEditing = Boolean(id);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: DIFFICULTY_LEVELS.MEDIUM,
    settings: {
      timeLimit: 30,
      allowRetake: false,
      showResults: true,
      shuffleQuestions: false,
    },
    status: 'draft',
    questions: []
  });

  // Question form state
  const [currentQuestion, setCurrentQuestion] = useState({
    type: QUESTION_TYPES.MULTIPLE_CHOICE,
    question: '',
    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    correctAnswer: '',
    explanation: '',
    points: 1
  });

  // UI state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Load quiz data if editing
  useEffect(() => {
    if (isEditing && id) {
      loadQuizData();
    }
  }, [isEditing, id]);

  const loadQuizData = async () => {
    try {
      const quiz = await getQuiz(id);
      setFormData({
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.metadata?.difficulty || quiz.difficulty,
        settings: {
          timeLimit: quiz.settings?.timeLimit ?? 30,
          allowRetake: quiz.settings?.allowRetake ?? false,
          showResults: quiz.settings?.showResults ?? true,
          shuffleQuestions: quiz.settings?.shuffleQuestions ?? false,
        },
        status: quiz.status,
        questions: quiz.questions || []
      });
    } catch (error) {
      toast.error('Failed to load quiz data');
      navigate('/quizzes');
    }
  };

  const handleBasicInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? { ...option, text: value } : option)
    }));
  };

  const addQuestion = () => {
    // Validate question
    if (!currentQuestion.question_text || !currentQuestion.question_text.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (currentQuestion.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      const validOptions = currentQuestion.options.filter(opt => opt.text && opt.text.trim());
      if (validOptions.length < 2) {
        toast.error('At least 2 options are required for multiple choice questions');
        return;
      }
      if (!currentQuestion.correctAnswer) {
        toast.error('Please select the correct answer');
        return;
      }
    }

    if (currentQuestion.type === QUESTION_TYPES.TRUE_FALSE && !currentQuestion.correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    const newQuestion = {
      ...currentQuestion,
      id: Date.now(), // Temporary ID for frontend
      order: formData.questions.length + 1
    };

    if (editingQuestionIndex >= 0) {
      // Update existing question
      setFormData(prev => ({
        ...prev,
        questions: prev.questions.map((q, index) => 
          index === editingQuestionIndex ? newQuestion : q
        )
      }));
      toast.success('Question updated successfully');
    } else {
      // Add new question
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
      toast.success('Question added successfully');
    }

    // Reset form
    resetQuestionForm();
    setShowQuestionModal(false);
  };

  const editQuestion = (index) => {
    const question = formData.questions[index];
    setCurrentQuestion(question);
    setEditingQuestionIndex(index);
    setShowQuestionModal(true);
  };

  const deleteQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    toast.success('Question deleted successfully');
  };

  const resetQuestionForm = () => {
    setCurrentQuestion({
      type: QUESTION_TYPES.MULTIPLE_CHOICE,
      question: '',
      options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
      correctAnswer: '',
      explanation: '',
      points: 1
    });
    setEditingQuestionIndex(-1);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Quiz title is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Quiz description is required');
      return false;
    }
    if (formData.questions.length === 0) {
      toast.error('At least one question is required');
      return false;
    }
    if ((formData.settings?.timeLimit ?? 0) < 1) {
      toast.error('Time limit must be at least 1 minute');
      return false;
    }
    return true;
  };

  const handleSave = async (status = 'draft') => {
    if (!validateForm()) return;

    setSaveStatus('saving');
    try {
      const quizData = {
        title: formData.title,
        description: formData.description,
        subject: 'General',
        status,
        metadata: { difficulty: formData.difficulty },
        settings: formData.settings,
        questions: formData.questions.map((q, index) => ({
          type: q.type,
          question: q.question_text || q.question || "",
          options: q.type === QUESTION_TYPES.MULTIPLE_CHOICE ? q.options.map((opt) => ({ text: opt.text, isCorrect: opt.text === q.correctAnswer })) : undefined,
          correctAnswer: q.type !== QUESTION_TYPES.MULTIPLE_CHOICE ? q.correctAnswer : undefined,
          explanation: q.explanation || "",
          points: q.points || 0,
          difficulty: formData.difficulty,
          order: index + 1,
        })),
      };

      if (isEditing) {
        await updateQuiz(id, quizData);
        toast.success('Quiz updated successfully');
      } else {
        await createQuiz(quizData);
        toast.success('Quiz created successfully');
      }

      navigate('/quizzes');
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} quiz`);
    } finally {
      setSaveStatus('');
    }
  };

  const handlePublish = () => {
    handleSave('published');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.title.trim() || !formData.description.trim()) {
        toast.error('Please fill in the basic information');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      {[1, 2, 3].map(step => (
        <div 
          key={step}
          className={`${styles.step} ${currentStep >= step ? styles.active : ''}`}
        >
          <div className={styles.stepNumber}>{step}</div>
          <div className={styles.stepLabel}>
            {step === 1 ? 'Basic Info' : step === 2 ? 'Questions' : 'Settings & Preview'}
          </div>
        </div>
      ))}
    </div>
  );

  const renderBasicInfo = () => (
    <Card className={styles.stepCard}>
      <h2>Basic Information</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="title">Quiz Title *</label>
        <Input
          id="title"
          type="text"
          placeholder="Enter quiz title..."
          value={formData.title}
          onChange={(e) => handleBasicInfoChange('title', e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          className={styles.textarea}
          placeholder="Enter quiz description..."
          value={formData.description}
          onChange={(e) => handleBasicInfoChange('description', e.target.value)}
          rows={4}
          required
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="difficulty">Difficulty Level</label>
          <select
            id="difficulty"
            className={styles.select}
            value={formData.difficulty}
            onChange={(e) => handleBasicInfoChange('difficulty', e.target.value)}
          >
            <option value={DIFFICULTY_LEVELS.EASY}>Easy</option>
            <option value={DIFFICULTY_LEVELS.MEDIUM}>Medium</option>
            <option value={DIFFICULTY_LEVELS.HARD}>Hard</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="time_limit">Time Limit (minutes)</label>
          <Input
            id="time_limit"
            type="number"
            min="1"
            max="180"
            value={formData.settings.timeLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, settings: { ...prev.settings, timeLimit: parseInt(e.target.value) } }))}
          />
        </div>
      </div>
    </Card>
  );

  const renderQuestions = () => (
    <Card className={styles.stepCard}>
      <div className={styles.questionsHeader}>
        <h2>Questions ({formData.questions.length})</h2>
        <Button
          variant="primary"
          onClick={() => setShowQuestionModal(true)}
        >
          Add Question
        </Button>
      </div>

      {formData.questions.length === 0 ? (
        <div className={styles.emptyQuestions}>
          <p>No questions added yet. Click "Add Question" to get started.</p>
        </div>
      ) : (
        <div className={styles.questionsList}>
          {formData.questions.map((question, index) => (
            <Card key={question.id || index} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <div className={styles.questionMeta}>
                  <span className={styles.questionNumber}>Q{index + 1}</span>
                  <span className={styles.questionType}>{question.type.replace('_', ' ')}</span>
                  <span className={styles.questionPoints}>{question.points} pts</span>
                </div>
                <div className={styles.questionActions}>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => editQuestion(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => deleteQuestion(index)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className={styles.questionContent}>
                <p className={styles.questionText}>{question.question}</p>
                
                {question.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
                  <div className={styles.questionOptions}>
                    {question.options.filter(opt => opt.text && opt.text.trim()).map((option, optIndex) => (
                      <div 
                        key={optIndex}
                        className={`${styles.option} ${option.text === question.correctAnswer ? styles.correct : ''}`}
                      >
                        {String.fromCharCode(65 + optIndex)}. {option.text}
                        {option.text === question.correctAnswer && <span className={styles.correctMark}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}

                {question.type === QUESTION_TYPES.TRUE_FALSE && (
                  <div className={styles.trueFalseOptions}>
                    <span className={question.correctAnswer === 'true' ? styles.correct : ''}>
                      True {question.correctAnswer === 'true' && '✓'}
                    </span>
                    <span className={question.correctAnswer === 'false' ? styles.correct : ''}>
                      False {question.correctAnswer === 'false' && '✓'}
                    </span>
                  </div>
                )}

                {question.explanation && (
                  <div className={styles.questionExplanation}>
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );

  const renderSettings = () => (
    <div className={styles.settingsStep}>
      <Card className={styles.stepCard}>
        <h2>Quiz Settings</h2>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="attempts_allowed">Attempts Allowed</label>
            <Input
              id="attempts_allowed"
              type="number"
              min="1"
              max="10"
              value={formData.attempts_allowed}
              onChange={(e) => handleBasicInfoChange('attempts_allowed', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.checkboxGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.show_results}
              onChange={(e) => handleBasicInfoChange('show_results', e.target.checked)}
            />
            Show results to students after completion
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.randomize_questions}
              onChange={(e) => handleBasicInfoChange('randomize_questions', e.target.checked)}
            />
            Randomize question order
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.require_sequential}
              onChange={(e) => handleBasicInfoChange('require_sequential', e.target.checked)}
            />
            Require sequential answering (no skipping questions)
          </label>
        </div>
      </Card>

      <Card className={styles.stepCard}>
        <div className={styles.previewHeader}>
          <h2>Quiz Preview</h2>
          <Button
            variant="outline"
            onClick={() => setShowPreview(true)}
          >
            Full Preview
          </Button>
        </div>
        
        <div className={styles.previewSummary}>
          <div className={styles.summaryItem}>
            <strong>Title:</strong> {formData.title}
          </div>
          <div className={styles.summaryItem}>
            <strong>Description:</strong> {formData.description}
          </div>
          <div className={styles.summaryItem}>
            <strong>Questions:</strong> {formData.questions.length}
          </div>
          <div className={styles.summaryItem}>
            <strong>Total Points:</strong> {formData.questions.reduce((sum, q) => sum + q.points, 0)}
          </div>
          <div className={styles.summaryItem}>
            <strong>Time Limit:</strong> {formData.time_limit} minutes
          </div>
          <div className={styles.summaryItem}>
            <strong>Difficulty:</strong> {formData.difficulty}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderQuestionModal = () => (
    <Modal
      isOpen={showQuestionModal}
      onClose={() => {
        setShowQuestionModal(false);
        resetQuestionForm();
      }}
      title={editingQuestionIndex >= 0 ? 'Edit Question' : 'Add Question'}
      size="large"
    >
      <div className={styles.questionForm}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="question_type">Question Type</label>
            <select
              id="question_type"
              className={styles.select}
              value={currentQuestion.type}
              onChange={(e) => handleQuestionChange('type', e.target.value)}
            >
              <option value={QUESTION_TYPES.MULTIPLE_CHOICE}>Multiple Choice</option>
              <option value={QUESTION_TYPES.TRUE_FALSE}>True/False</option>
              <option value={QUESTION_TYPES.SHORT_ANSWER}>Short Answer</option>
              <option value={QUESTION_TYPES.ESSAY}>Essay</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="question_points">Points</label>
            <Input
              id="question_points"
              type="number"
              min="1"
              max="10"
              value={currentQuestion.points}
              onChange={(e) => handleQuestionChange('points', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="question_text">Question Text *</label>
          <textarea
            id="question_text"
            className={styles.textarea}
            placeholder="Enter your question..."
            value={currentQuestion.question_text || ""}
            onChange={(e) => handleQuestionChange('question_text', e.target.value)}
            rows={3}
            required
          />
        </div>

        {currentQuestion.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
          <div className={styles.optionsSection}>
            <label>Answer Options *</label>
            {currentQuestion.options.map((option, index) => (
              <div key={index} className={styles.optionInput}>
                <Input
                  type="text"
                  placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  value={option.text || ""}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <label className={styles.correctOption}>
                  <input
                    type="radio"
                    name="correct_answer"
                    value={option.text}
                    checked={currentQuestion.correctAnswer === option.text}
                    onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                  />
                  Correct
                </label>
              </div>
            ))}
          </div>
        )}

        {currentQuestion.type === QUESTION_TYPES.TRUE_FALSE && (
          <div className={styles.trueFalseSection}>
            <label>Correct Answer *</label>
            <div className={styles.trueFalseOptions}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="correct_answer"
                  value="true"
                  checked={currentQuestion.correctAnswer === 'true'}
                  onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                />
                True
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="correct_answer"
                  value="false"
                  checked={currentQuestion.correctAnswer === 'false'}
                  onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
                />
                False
              </label>
            </div>
          </div>
        )}

        {(currentQuestion.type === QUESTION_TYPES.SHORT_ANSWER || currentQuestion.type === QUESTION_TYPES.ESSAY) && (
          <div className={styles.formGroup}>
            <label htmlFor="sample_answer">Sample Answer (for grading reference)</label>
            <textarea
              id="sample_answer"
              className={styles.textarea}
              placeholder="Enter a sample answer..."
              value={currentQuestion.correctAnswer || ""}
              onChange={(e) => handleQuestionChange('correctAnswer', e.target.value)}
              rows={3}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="explanation">Explanation (optional)</label>
          <textarea
            id="explanation"
            className={styles.textarea}
            placeholder="Explain the correct answer..."
            value={currentQuestion.explanation || ""}
            onChange={(e) => handleQuestionChange('explanation', e.target.value)}
            rows={2}
          />
        </div>

        <div className={styles.modalActions}>
          <Button
            variant="outline"
            onClick={() => {
              setShowQuestionModal(false);
              resetQuestionForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={addQuestion}
          >
            {editingQuestionIndex >= 0 ? 'Update Question' : 'Add Question'}
          </Button>
        </div>
      </div>
    </Modal>
  );

  if (loading) {
    return <Loading />;
  }

  return (
    <div className={styles.createQuizPage}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{isEditing ? 'Edit Quiz' : 'Create New Quiz'}</h1>
          <p className={styles.subtitle}>
            {isEditing ? 'Update your quiz content and settings' : 'Build a comprehensive quiz for your students'}
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            variant="outline"
            onClick={() => navigate('/quizzes')}
            disabled={saveStatus === 'saving'}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            variant="primary"
            onClick={handlePublish}
            disabled={saveStatus === 'saving' || formData.questions.length === 0}
          >
            {saveStatus === 'saving' ? 'Publishing...' : 'Publish Quiz'}
          </Button>
        </div>
      </div>

      {renderStepIndicator()}

      <div className={styles.stepContent}>
        {currentStep === 1 && renderBasicInfo()}
        {currentStep === 2 && renderQuestions()}
        {currentStep === 3 && renderSettings()}
      </div>

      <div className={styles.stepNavigation}>
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <div className={styles.stepInfo}>
          Step {currentStep} of 3
        </div>

        <Button
          variant="primary"
          onClick={nextStep}
          disabled={currentStep === 3}
        >
          Next
        </Button>
      </div>

      {renderQuestionModal()}
    </div>
  );
}