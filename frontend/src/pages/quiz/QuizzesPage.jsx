import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import clsx from 'clsx';
import styles from './QuizzesPage.module.css';
import AuthContext from '../../context/AuthContext';
import QuizContext from '../../context/QuizContext';

function getStatusColor(status) {
	switch (status) {
		case 'published': return '#4caf50';
		case 'draft': return '#ff9800';
		case 'archived': return '#9e9e9e';
		default: return '#607d8b';
	}
}

function getDifficultyColor(difficulty) {
	switch (difficulty) {
		case 'easy': return '#4caf50';
		case 'medium': return '#ff9800';
		case 'hard': return '#f44336';
		default: return '#607d8b';
	}
}

function formatDate(date) {
	if (!date) return '';
	return new Date(date).toLocaleDateString();
}

export default function QuizzesPage() {
	const navigate = useNavigate();
	const { user } = useContext(AuthContext);
	const { quizzes, loading, error } = useContext(QuizContext);

	// Example filters and search (customize as needed)
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [statusModal, setStatusModal] = useState({ open: false, quiz: null });
	const [deleteModal, setDeleteModal] = useState({ open: false, quiz: null });

	// Filter quizzes based on search/filter
	const currentQuizzes = quizzes
		? quizzes.filter((quiz) => {
				const matchesSearch =
					!searchTerm || quiz.title.toLowerCase().includes(searchTerm.toLowerCase());
				const matchesStatus =
					statusFilter === 'all' || quiz.status === statusFilter;
				const matchesDifficulty =
					difficultyFilter === 'all' || quiz.difficulty === difficultyFilter;
				return matchesSearch && matchesStatus && matchesDifficulty;
			})
		: [];

	if (loading) {
		return <div className={styles.loading}>Loading quizzes...</div>;
	}
	if (error) {
		return <div className={styles.error}>Error loading quizzes: {error}</div>;
	}

	return (
		<>
			{currentQuizzes.length === 0 ? (
				<Card className={styles.emptyState}>
					<div className={styles.emptyContent}>
						<h3>No quizzes found</h3>
						<p>
							{searchTerm || statusFilter !== 'all' || difficultyFilter !== 'all'
								? 'Try adjusting your search or filters'
								: user.role === 'student'
								? 'No quizzes are available at the moment'
								: 'Create your first quiz to get started'}
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
				<div className={styles.quizStack}>
					{currentQuizzes.map((quiz) => (
						<Card key={quiz._id} className={clsx(styles.quizCard, styles.quizStackCard)}>
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
											onClick={() => navigate(`/quizzes/${quiz._id}/edit`)}
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

							<div className={styles.quizDetails}>
								<div className={styles.quizMeta}>
									<span>Status: {quiz.status}</span>
									<span>Questions: {quiz.questions.length}</span>
									<span>Duration: {quiz.settings?.timeLimit} min</span>
									<span>By {quiz.createdBy?.name || 'Unknown'}</span>
									<span>{formatDate(quiz.createdAt)}</span>
								</div>
								<div className={styles.quizDescription}>
									<p>{quiz.description}</p>
								</div>
								{/* Show questions only to creator or assigned users */}
								{(quiz.questions && quiz.questions.length > 0 &&
									((user.role === 'admin') || (quiz.createdBy?._id === user.id) || (quiz.assignedTo && quiz.assignedTo.some(u => u._id === user.id)))) && (
										<div className={styles.quizQuestions}>
											<strong>Questions:</strong>
											<ul>
												{quiz.questions.map((q, idx) => (
													<li key={idx}>{q.question}</li>
												))}
											</ul>
										</div>
								)}
							</div>

							<div className={styles.quizFooter}>
								<div className={styles.createdInfo}>
									<span className={styles.createdBy}>
										By {quiz.createdBy?.name || quiz.created_by_name || 'Unknown'}
									</span>
									<span className={styles.createdDate}>
										{formatDate(quiz.createdAt || quiz.created_at)}
									</span>
								</div>

								<div className={styles.quizButtons}>
									<Button
										variant="outline"
										size="small"
										onClick={() => navigate(`/quizzes/${quiz._id}`)}
									>
										View Details
									</Button>
									{user.role === 'student' && quiz.status === 'published' && (
										<Button
											variant="primary"
											size="medium"
											className={styles.takeQuizButton}
											onClick={() => navigate(`/quizzes/${quiz._id}/take`)}
										>
											Take Quiz
										</Button>
									)}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</>
	);
}

