import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, StatsCard, Button, Loading } from '../../components/common';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to fetch dashboard data
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Mock data based on user role
        setTimeout(() => {
          if (isStudent()) {
            setStats({
              totalQuizzes: 15,
              completedQuizzes: 8,
              averageScore: 85.5,
              currentStreak: 5,
              upcomingQuizzes: 3,
              recentActivities: [
                { id: 1, type: 'quiz_completed', title: 'Mathematics Quiz', score: 92, date: '2024-01-15' },
                { id: 2, type: 'quiz_started', title: 'Science Quiz', date: '2024-01-14' },
                { id: 3, type: 'competition_joined', title: 'Weekly Challenge', date: '2024-01-13' }
              ]
            });
          } else if (isTeacher()) {
            setStats({
              totalQuizzes: 12,
              totalStudents: 45,
              totalSubmissions: 340,
              averageScore: 78.3,
              activeQuizzes: 5,
              recentActivities: [
                { id: 1, type: 'quiz_created', title: 'Physics Chapter 5', date: '2024-01-15' },
                { id: 2, type: 'submission_received', title: 'Chemistry Quiz', student: 'John Doe', date: '2024-01-14' },
                { id: 3, type: 'announcement_posted', title: 'Weekly Review Session', date: '2024-01-13' }
              ]
            });
          } else if (isAdmin()) {
            setStats({
              totalUsers: 1250,
              totalQuizzes: 180,
              totalSubmissions: 8500,
              systemHealth: 98.5,
              activeUsers: 89,
              recentActivities: [
                { id: 1, type: 'user_registered', title: 'New Teacher Registration', user: 'Jane Smith', date: '2024-01-15' },
                { id: 2, type: 'system_update', title: 'Database Backup Completed', date: '2024-01-14' },
                { id: 3, type: 'security_alert', title: 'Login Anomaly Detected', date: '2024-01-13' }
              ]
            });
          }
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [isStudent, isTeacher, isAdmin]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <Loading size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const renderStudentDashboard = () => (
    <>
      <div className="dashboard__stats">
        <StatsCard
          title="Available Quizzes"
          value={stats.totalQuizzes}
          icon="📝"
          color="blue"
          trend="up"
          trendValue="+2 this week"
        />
        <StatsCard
          title="Completed Quizzes"
          value={stats.completedQuizzes}
          icon="✅"
          color="green"
          trend="up"
          trendValue={`${Math.round((stats.completedQuizzes / stats.totalQuizzes) * 100)}% completion`}
        />
        <StatsCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon="📊"
          color="purple"
          trend="up"
          trendValue="+3.2% from last month"
        />
        <StatsCard
          title="Current Streak"
          value={`${stats.currentStreak} days`}
          icon="🔥"
          color="orange"
          trend="up"
          trendValue="Personal best!"
        />
      </div>

      <div className="dashboard__content">
        <Card title="Quick Actions" className="dashboard__quick-actions">
          <div className="quick-actions">
            <Button variant="primary" size="lg">
              Take a Quiz
            </Button>
            <Button variant="outline" size="lg">
              View Results
            </Button>
            <Button variant="ghost" size="lg">
              Join Competition
            </Button>
          </div>
        </Card>

        <Card title="Recent Activity" className="dashboard__activities">
          <div className="activity-list">
            {stats.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'quiz_completed' && '✅'}
                  {activity.type === 'quiz_started' && '📝'}
                  {activity.type === 'competition_joined' && '🏆'}
                </div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  {activity.score && <p>Score: {activity.score}%</p>}
                  <span className="activity-date">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  const renderTeacherDashboard = () => (
    <>
      <div className="dashboard__stats">
        <StatsCard
          title="My Quizzes"
          value={stats.totalQuizzes}
          icon="📝"
          color="blue"
          trend="up"
          trendValue="+2 this month"
        />
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon="👥"
          color="green"
          trend="up"
          trendValue="+5 new enrollments"
        />
        <StatsCard
          title="Submissions"
          value={stats.totalSubmissions}
          icon="📄"
          color="purple"
          trend="up"
          trendValue="+18 this week"
        />
        <StatsCard
          title="Average Score"
          value={`${stats.averageScore}%`}
          icon="📊"
          color="orange"
          trend="up"
          trendValue="+2.1% improvement"
        />
      </div>

      <div className="dashboard__content">
        <Card title="Quick Actions" className="dashboard__quick-actions">
          <div className="quick-actions">
            <Button variant="primary" size="lg">
              Create Quiz
            </Button>
            <Button variant="outline" size="lg">
              View Submissions
            </Button>
            <Button variant="ghost" size="lg">
              Post Announcement
            </Button>
          </div>
        </Card>

        <Card title="Recent Activity" className="dashboard__activities">
          <div className="activity-list">
            {stats.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'quiz_created' && '➕'}
                  {activity.type === 'submission_received' && '📄'}
                  {activity.type === 'announcement_posted' && '📢'}
                </div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  {activity.student && <p>Student: {activity.student}</p>}
                  <span className="activity-date">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  const renderAdminDashboard = () => (
    <>
      <div className="dashboard__stats">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="blue"
          trend="up"
          trendValue="+47 this month"
        />
        <StatsCard
          title="Total Quizzes"
          value={stats.totalQuizzes}
          icon="📝"
          color="green"
          trend="up"
          trendValue="+12 this week"
        />
        <StatsCard
          title="Submissions"
          value={stats.totalSubmissions}
          icon="📄"
          color="purple"
          trend="up"
          trendValue="+340 this week"
        />
        <StatsCard
          title="System Health"
          value={`${stats.systemHealth}%`}
          icon="💚"
          color="green"
          trend="up"
          trendValue="All systems operational"
        />
      </div>

      <div className="dashboard__content">
        <Card title="Quick Actions" className="dashboard__quick-actions">
          <div className="quick-actions">
            <Button variant="primary" size="lg">
              Manage Users
            </Button>
            <Button variant="outline" size="lg">
              System Analytics
            </Button>
            <Button variant="ghost" size="lg">
              Security Settings
            </Button>
          </div>
        </Card>

        <Card title="System Activity" className="dashboard__activities">
          <div className="activity-list">
            {stats.recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'user_registered' && '👤'}
                  {activity.type === 'system_update' && '🔄'}
                  {activity.type === 'security_alert' && '🔒'}
                </div>
                <div className="activity-content">
                  <h4>{activity.title}</h4>
                  {activity.user && <p>User: {activity.user}</p>}
                  <span className="activity-date">{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="dashboard__welcome">
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Here's what's happening with your {user?.role} account today.</p>
        </div>
        <div className="dashboard__date">
          <span>{new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {isStudent() && renderStudentDashboard()}
      {isTeacher() && renderTeacherDashboard()}
      {isAdmin() && renderAdminDashboard()}
    </div>
  );
};

export default DashboardPage;