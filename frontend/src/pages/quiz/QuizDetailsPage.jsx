import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Loading, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';
import { toast } from 'react-hot-toast';
import styles from './QuizDetailsPage.module.css';

export default function QuizDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // useQuiz provides these methods/state
  const {
    fetchQuizById,
    deleteQuiz,
    updateQuiz,
    isLoading,
  } = useQuiz();

  const [quiz, setQuiz] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadQuizData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadQuizData = async () => {
    try {
      const result = await fetchQuizById(id);
      if (result?.success) {
        setQuiz(result.data);
        setStatistics(result.data?.statistics || null);
      } else {
        throw new Error(result?.error || 'Failed to load quiz');
      }
    } catch (error) {
      toast.error('Failed to load quiz details');
      navigate('/quizzes');
    }
  };

  const handleDeleteQuiz = async () => {
    try {
      const res = await deleteQuiz(id);
      if (res?.success) {
        toast.success('Quiz deleted successfully');
        navigate('/quizzes');
      } else {
        throw new Error(res?.error || 'Delete failed');
      }
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await updateQuiz(id, { status: newStatus });
      if (res?.success) {
        setQuiz(prev => ({ ...prev, status: newStatus }));
        setShowStatusModal(false);
        toast.success(`Quiz ${newStatus} successfully`);
      } else {
        throw new Error(res?.error || 'Update failed');
      }
    } catch (error) {
      toast.error('Failed to update quiz status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'var(--success-500)';
      case 'medium': return 'var(--warning-500)';
      case 'hard': return 'var(--error-500)';
      default: return 'var(--gray-500)';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'var(--success-500)';
      case 'draft': return 'var(--gray-500)';
      case 'archived': return 'var(--warning-500)';
      default: return 'var(--gray-500)';
    }
  };

  const canTakeQuiz = () => user.role === 'student' && quiz?.status === 'published';

  const canEditQuiz = () => {
    const createdById = quiz?.created_by || quiz?.createdBy?._id || quiz?.createdBy || quiz?.createdById;
    return (user.role === 'teacher' && createdById === user.id) || user.role === 'admin';
  };

  const renderOverviewTab = () => (
    <div className={styles.overviewContent}>
      <Card className={styles.detailsCard}>
        <h3>Quiz Information</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Status:</span>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(quiz.status) }}
            >
              {quiz.status}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Difficulty:</span>
            <span
              className={styles.difficultyBadge}
              style={{ color: getDifficultyColor(quiz.difficulty || quiz.metadata?.difficulty) }}
            >
              {quiz.difficulty || quiz.metadata?.difficulty || 'medium'}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Questions:</span>
            <span className={styles.infoValue}>{quiz.questions?.length || 0}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Time Limit:</span>
            <span className={styles.infoValue}>{quiz.settings?.timeLimit ?? 60} minutes</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Attempts:</span>
            <span className={styles.infoValue}>{quiz.settings?.allowRetake ? 'Multiple' : 'Single'}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Total Points:</span>
            <span className={styles.infoValue}>
              {quiz.metadata?.totalPoints ?? (quiz.questions?.reduce((sum, q) => sum + (q.points || 1), 0) || 0)}
            </span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Created:</span>
            <span className={styles.infoValue}>{formatDate(quiz.created_at || quiz.createdAt)}</span>
          </div>

          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Updated:</span>
            <span className={styles.infoValue}>{formatDate(quiz.updated_at || quiz.updatedAt)}</span>
          </div>
        </div>
      </Card>

      <Card className={styles.settingsCard}>
        <h3>Quiz Settings</h3>
        <div className={styles.settingsList}>
          <div className={styles.settingItem}>
            <span className={styles.settingIcon}>👁️</span>
            <span className={styles.settingText}>
              {quiz.settings?.showResults ? 'Show results after completion' : 'Hide results from students'}
            </span>
          </div>

          <div className={styles.settingItem}>
            <span className={styles.settingIcon}>🔀</span>
            <span className={styles.settingText}>
              {quiz.settings?.shuffleQuestions ? 'Questions are randomized' : 'Questions in fixed order'}
            </span>
          </div>

          <div className={styles.settingItem}>
            <span className={styles.settingIcon}>⏭️</span>
            <span className={styles.settingText}>
              {quiz.settings?.allowRetake ? 'Retakes allowed' : 'Single attempt'}
            </span>
          </div>
        </div>
      </Card>

      {statistics && (
        <Card className={styles.statsCard}>
          <h3>Quiz Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{statistics.totalAttempts || 0}</div>
              <div className={styles.statLabel}>Total Attempts</div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>{(statistics.averageScore ?? 0).toFixed(1)}%</div>
              <div className={styles.statLabel}>Average Score</div>
            </div>

            <div className={styles.statItem}>
              <div className={styles.statValue}>{(statistics.completionRate ?? 0).toFixed(1)}%</div>
              <div className={styles.statLabel}>Completion Rate</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderQuestionsTab = () => (
    <div className={styles.questionsContent}>
      {quiz.questions?.length === 0 ? (
        <Card className={styles.emptyQuestions}>
          <h3>No Questions</h3>
          <p>This quiz doesn't have any questions yet.</p>
          {canEditQuiz() && (
            <Button
              variant="primary"
              onClick={() => navigate(`/quiz/${id}/edit`)}
            >
              Add Questions
            </Button>
          )}
        </Card>
      ) : (
        <div className={styles.questionsList}>
          {quiz.questions?.map((question, index) => (
            <Card key={question._id || index} className={styles.questionCard}>
              <div className={styles.questionHeader}>
                <div className={styles.questionMeta}>
                  <span className={styles.questionNumber}>Q{index + 1}</span>
                  <span className={styles.questionType}>
                    {(question.type || '').replace('-', ' ')}
                  </span>
                  <span className={styles.questionPoints}>{question.points || 1} pts</span>
                </div>
              </div>

              <div className={styles.questionContent}>
                <p className={styles.questionText}>{question.question || question.question_text}</p>

                {question.type === 'multiple-choice' && (
                  <div className={styles.questionOptions}>
                    {question.options?.map((opt, optIndex) => (
                      <div
                        key={opt._id || optIndex}
                        className={`${styles.option} ${opt.isCorrect ? styles.correct : ''}`}
                      >
                        {String.fromCharCode(65 + optIndex)}. {opt.text}
                        {opt.isCorrect && <span className={styles.correctMark}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && (
                  <div className={styles.trueFalseOptions}>
                    <span className={question.correctAnswer?.toLowerCase() === 'true' ? styles.correct : ''}>
                      True {question.correctAnswer?.toLowerCase() === 'true' && '✓'}
                    </span>
                    <span className={question.correctAnswer?.toLowerCase() === 'false' ? styles.correct : ''}>
                      False {question.correctAnswer?.toLowerCase() === 'false' && '✓'}
                    </span>
                  </div>
                )}

                {(question.type === 'short-answer' || question.type === 'essay') && (
                  <div className={styles.sampleAnswer}>
                    <strong>Sample Answer:</strong>
                    <p>{question.correctAnswer || 'No sample answer provided'}</p>
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
    </div>
  );

  const renderSubmissionsTab = () => (
    <div className={styles.submissionsContent}>
      <Card>
        <div className={styles.submissionsHeader}>
          <h3>Recent Submissions</h3>
          <Button
            variant="outline"
            onClick={() => navigate(`/submissions?quiz=${id}`)}
          >
            View All Submissions
          </Button>
        </div>

        <div className={styles.submissionsPreview}>
          <p>Submission details will be shown here...</p>
          <Button
            variant="primary"
            onClick={() => navigate(`/submissions?quiz=${id}`)}
          >
            Manage Submissions
          </Button>
        </div>
      </Card>
    </div>
  );

  if (isLoading || !quiz) {
    return <Loading />;
  }

  return (
    <div className={styles.quizDetailsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.breadcrumb}>
            <Link to="/quizzes">Quizzes</Link>
            <span className={styles.breadcrumbSeparator}>→</span>
            <span>{quiz.title}</span>
          </div>

          <h1>{quiz.title}</h1>
          <p className={styles.description}>{quiz.description}</p>

          <div className={styles.headerMeta}>
            <span className={styles.createdBy}>
              By {quiz.createdBy?.name || quiz.created_by_name || 'Unknown'}
            </span>
            <span className={styles.createdDate}>
              Created {formatDate(quiz.created_at || quiz.createdAt)}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          {canTakeQuiz() && (
            <Button
              variant="primary"
              size="large"
              onClick={() => navigate(`/quizzes/${id}/take`)}
            >
              Take Quiz
            </Button>
          )}

          {canEditQuiz() && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/quizzes/${id}/edit`)}
              >
                Edit Quiz
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowStatusModal(true)}
              >
                Change Status
              </Button>

              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </Button>
            </>
          )}

          {(user.role === 'teacher' || user.role === 'admin') && (
            <Button
              variant="outline"
              onClick={() => navigate(`/analytics?quiz=${id}`)}
            >
              View Analytics
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>

        <button
          className={`${styles.tab} ${activeTab === 'questions' ? styles.active : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Questions ({quiz.questions?.length || 0})
        </button>

        {(user.role === 'teacher' || user.role === 'admin') && (
          <button
            className={`${styles.tab} ${activeTab === 'submissions' ? styles.active : ''}`}
            onClick={() => setActiveTab('submissions')}
          >
            Submissions
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'questions' && renderQuestionsTab()}
        {activeTab === 'submissions' && renderSubmissionsTab()}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Quiz"
        type="danger"
      >
        <p>
          Are you sure you want to delete "{quiz.title}"?
          This action cannot be undone and will remove all associated submissions.
        </p>
        <div className={styles.modalActions}>
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteQuiz}
          >
            Delete Quiz
          </Button>
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Quiz Status"
      >
        <p>Change status for "{quiz.title}":</p>
        <div className={styles.statusOptions}>
          <Button
            variant="outline"
            onClick={() => handleStatusChange('draft')}
            disabled={quiz.status === 'draft'}
          >
            Draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleStatusChange('published')}
            disabled={quiz.status === 'published'}
          >
            Published
          </Button>
          <Button
            variant="warning"
            onClick={() => handleStatusChange('archived')}
            disabled={quiz.status === 'archived'}
          >
            Archived
          </Button>
        </div>
      </Modal>
    </div>
  );
}