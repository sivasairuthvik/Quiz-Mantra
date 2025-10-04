import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';
import { toast } from 'react-hot-toast';
import styles from './QuizzesPage.module.css';

export default function QuizzesPage() {
  const { user } = useAuth();
  const { 
    quizzes, 
    loading, 
    error,
    fetchQuizzes, 
    deleteQuiz,
    updateQuizStatus 
  } = useQuiz();
  
  const navigate = useNavigate();
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // State for modals
  const [deleteModal, setDeleteModal] = useState({ open: false, quiz: null });
  const [statusModal, setStatusModal] = useState({ open: false, quiz: null });

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  // Filter and search logic
  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quiz.status === statusFilter;
    const matchesDifficulty = difficultyFilter === 'all' || quiz.difficulty === difficultyFilter;
    
    // Role-based filtering
    if (user.role === 'student') {
      return matchesSearch && matchesStatus && matchesDifficulty && quiz.status === 'published';
    }
    
    if (user.role === 'teacher') {
      return matchesSearch && matchesStatus && matchesDifficulty && quiz.created_by === user.id;
    }
    
    // Admin sees all quizzes
    return matchesSearch && matchesStatus && matchesDifficulty;
  });

  // Sort logic
  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedQuizzes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuizzes = sortedQuizzes.slice(startIndex, endIndex);

  const handleDeleteQuiz = async () => {
    try {
      await deleteQuiz(deleteModal.quiz.id);
      toast.success('Quiz deleted successfully');
      setDeleteModal({ open: false, quiz: null });
    } catch (error) {
      toast.error('Failed to delete quiz');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await updateQuizStatus(statusModal.quiz.id, newStatus);
      toast.success(`Quiz ${newStatus} successfully`);
      setStatusModal({ open: false, quiz: null });
    } catch (error) {
      toast.error('Failed to update quiz status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Card>
          <h2>Error Loading Quizzes</h2>
          <p>{error}</p>
          <Button onClick={() => fetchQuizzes()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.quizzesPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Quizzes</h1>
          <p className={styles.subtitle}>
            {user.role === 'student' 
              ? 'Take quizzes and test your knowledge'
              : user.role === 'teacher'
              ? 'Manage your quizzes and track student progress'
              : 'Manage all quizzes in the system'
            }
          </p>
        </div>
        
        {(user.role === 'teacher' || user.role === 'admin') && (
          <Button 
            variant="primary" 
            onClick={() => navigate('/quizzes/create')}
            className={styles.createButton}
          >
            Create New Quiz
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card className={styles.filtersCard}>
        <div className={styles.filters}>
          <div className={styles.searchSection}>
            <Input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterGroup}>
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                {(user.role === 'teacher' || user.role === 'admin') && (
                  <>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </>
                )}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="difficulty-filter">Difficulty</label>
              <select
                id="difficulty-filter"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className={styles.select}
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="sort-by">Sort By</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.select}
              >
                <option value="created_at">Created Date</option>
                <option value="title">Title</option>
                <option value="difficulty">Difficulty</option>
                <option value="questions_count">Questions</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="sort-order">Order</label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className={styles.select}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className={styles.resultsCount}>
        <p>
          Showing {currentQuizzes.length} of {filteredQuizzes.length} quizzes
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Quiz Grid */}
      {currentQuizzes.length === 0 ? (
        <Card className={styles.emptyState}>
          <div className={styles.emptyContent}>
            <h3>No quizzes found</h3>
            <p>
              {searchTerm || statusFilter !== 'all' || difficultyFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : user.role === 'student'
                ? 'No quizzes are available at the moment'
                : 'Create your first quiz to get started'
              }
            </p>
            {(user.role === 'teacher' || user.role === 'admin') && (
              <Button 
                variant="primary" 
                onClick={() => navigate('/quizzes/create')}
                className={styles.createFirstButton}
              >
                Create Your First Quiz
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className={styles.quizGrid}>
          {currentQuizzes.map((quiz) => (
            <Card key={quiz.id} className={styles.quizCard}>
              <div className={styles.quizHeader}>
                <div className={styles.quizStatus}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(quiz.status) }}
                  >
                    {quiz.status}
                  </span>
                  <span 
                    className={styles.difficultyBadge}
                    style={{ color: getDifficultyColor(quiz.difficulty) }}
                  >
                    {quiz.difficulty}
                  </span>
                </div>
                
                {(user.role === 'teacher' || user.role === 'admin') && (
                  <div className={styles.quizActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}
                      title="Edit Quiz"
                    >
                      ✏️
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => setStatusModal({ open: true, quiz })}
                      title="Change Status"
                    >
                      🔄
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => setDeleteModal({ open: true, quiz })}
                      title="Delete Quiz"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.quizContent}>
                <h3 className={styles.quizTitle}>
                  <Link to={`/quizzes/${quiz.id}`}>
                    {quiz.title}
                  </Link>
                </h3>
                
                <p className={styles.quizDescription}>
                  {quiz.description}
                </p>

                <div className={styles.quizMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Questions:</span>
                    <span className={styles.metaValue}>{quiz.questions_count || 0}</span>
                  </div>
                  
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Duration:</span>
                    <span className={styles.metaValue}>{quiz.time_limit} min</span>
                  </div>
                  
                  {quiz.attempts_count > 0 && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Attempts:</span>
                      <span className={styles.metaValue}>{quiz.attempts_count}</span>
                    </div>
                  )}
                </div>

                <div className={styles.quizFooter}>
                  <div className={styles.createdInfo}>
                    <span className={styles.createdBy}>
                      By {quiz.created_by_name || 'Unknown'}
                    </span>
                    <span className={styles.createdDate}>
                      {formatDate(quiz.created_at)}
                    </span>
                  </div>

                  <div className={styles.quizButtons}>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => navigate(`/quizzes/${quiz.id}`)}
                    >
                      View Details
                    </Button>
                    
                    {user.role === 'student' && quiz.status === 'published' && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => navigate(`/quizzes/${quiz.id}/take`)}
                      >
                        Take Quiz
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="small"
                onClick={() => setCurrentPage(page)}
                className={styles.pageButton}
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, quiz: null })}
        title="Delete Quiz"
        type="danger"
      >
        <p>
          Are you sure you want to delete "{deleteModal.quiz?.title}"? 
          This action cannot be undone and will remove all associated submissions.
        </p>
        <div className={styles.modalActions}>
          <Button
            variant="outline"
            onClick={() => setDeleteModal({ open: false, quiz: null })}
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
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, quiz: null })}
        title="Change Quiz Status"
      >
        <p>Change status for "{statusModal.quiz?.title}":</p>
        <div className={styles.statusOptions}>
          <Button
            variant="outline"
            onClick={() => handleStatusChange('draft')}
            disabled={statusModal.quiz?.status === 'draft'}
          >
            Draft
          </Button>
          <Button
            variant="primary"
            onClick={() => handleStatusChange('published')}
            disabled={statusModal.quiz?.status === 'published'}
          >
            Published
          </Button>
          <Button
            variant="warning"
            onClick={() => handleStatusChange('archived')}
            disabled={statusModal.quiz?.status === 'archived'}
          >
            Archived
          </Button>
        </div>
      </Modal>
    </div>
  );
}