import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

// Icons (using simple Unicode symbols - you can replace with icon library)
const icons = {
  dashboard: '📊',
  quiz: '📝',
  create: '➕',
  submissions: '📄',
  analytics: '📈',
  competitions: '🏆',
  users: '👥',
  announcements: '📢',
  messages: '💬',
  profile: '👤',
  settings: '⚙️',
  chevronLeft: '◀',
  chevronRight: '▶',
  menu: '☰',
  close: '✕'
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, isTeacher, isStudent, isAdmin } = useAuth();
  const location = useLocation();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      {
          id: 'dashboard-main',
        name: 'Dashboard',
        path: '/dashboard',
        icon: icons.dashboard,
        roles: ['student', 'teacher', 'admin']
      },
      {
        id: 'profile',
        name: 'Profile',
        path: '/profile',
        icon: icons.profile,
        roles: ['student', 'teacher', 'admin']
      }
    ];

    const studentItems = [
      {
        id: 'available-quizzes',
        name: 'Available Quizzes',
        path: '/quizzes',
        icon: icons.quiz,
        roles: ['student']
      },
      {
        id: 'my-submissions',
        name: 'My Submissions',
        path: '/submissions',
        icon: icons.submissions,
        roles: ['student']
      },
      {
        id: 'competitions',
        name: 'Competitions',
        path: '/competitions',
        icon: icons.competitions,
        roles: ['student']
      },
      {
        id: 'messages',
        name: 'Messages',
        path: '/messages',
        icon: icons.messages,
        roles: ['student']
      }
    ];

    const teacherItems = [
      {
        id: 'my-quizzes',
        name: 'My Quizzes',
        path: '/quizzes',
        icon: icons.quiz,
        roles: ['teacher']
      },
      {
        id: 'create-quiz',
        name: 'Create Quiz',
        path: '/quiz/create',
        icon: icons.create,
        roles: ['teacher']
      },
      {
        id: 'submissions',
        name: 'Submissions',
        path: '/submissions',
        icon: icons.submissions,
        roles: ['teacher']
      },
      {
        id: 'analytics',
        name: 'Analytics',
        path: '/analytics',
        icon: icons.analytics,
        roles: ['teacher']
      },
      {
        id: 'competitions',
        name: 'Competitions',
        path: '/competitions',
        icon: icons.competitions,
        roles: ['teacher']
      },
      {
        id: 'announcements',
        name: 'Announcements',
        path: '/announcements',
        icon: icons.announcements,
        roles: ['teacher']
      },
      {
        id: 'messages',
        name: 'Messages',
        path: '/messages',
        icon: icons.messages,
        roles: ['teacher']
      }
    ];

    const adminItems = [
      {
        id: 'dashboard-admin',
        name: 'Dashboard',
        path: '/admin/dashboard',
        icon: icons.dashboard,
        roles: ['admin']
      },
      {
        id: 'all-quizzes',
        name: 'All Quizzes',
        path: '/admin/quizzes',
        icon: icons.quiz,
        roles: ['admin']
      },
      {
        id: 'users',
        name: 'Users',
        path: '/admin/users',
        icon: icons.users,
        roles: ['admin']
      },
      {
        id: 'analytics',
        name: 'Analytics',
        path: '/admin/analytics',
        icon: icons.analytics,
        roles: ['admin']
      },
      {
        id: 'competitions',
        name: 'Competitions',
        path: '/admin/competitions',
        icon: icons.competitions,
        roles: ['admin']
      },
      {
        id: 'announcements',
        name: 'Announcements',
        path: '/admin/announcements',
        icon: icons.announcements,
        roles: ['admin']
      },
      {
        id: 'messages',
        name: 'Messages',
        path: '/admin/messages',
        icon: icons.messages,
        roles: ['admin']
      },
      {
        id: 'settings',
        name: 'Settings',
        path: '/admin/settings',
        icon: icons.settings,
        roles: ['admin']
      }
    ];

    let allItems = [...commonItems];
    
    if (isStudent()) {
      allItems.push(...studentItems);
    } else if (isTeacher()) {
      allItems.push(...teacherItems);
    } else if (isAdmin()) {
      allItems.push(...adminItems);
    }

    return allItems.filter(item => 
      item.roles.includes(user?.role)
    );
  };

  const navigationItems = getNavigationItems();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="sidebar__overlay"
          onClick={closeMobile}
        />
      )}

      {/* Mobile toggle button */}
      <button 
        className="sidebar__mobile-toggle"
        onClick={toggleMobile}
        aria-label="Toggle navigation menu"
      >
        {isMobileOpen ? icons.close : icons.menu}
      </button>

      <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''} ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}>
        <div className="sidebar__header">
          {!isCollapsed && (
            <div className="sidebar__logo">
              <h1>Quiz Mantra</h1>
              <span className="sidebar__role">{user?.role}</span>
            </div>
          )}
          
          <button 
            className="sidebar__toggle"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? icons.chevronRight : icons.chevronLeft}
          </button>
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__nav-list">
            {navigationItems.map((item) => (
              <li key={item.id} className="sidebar__nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`
                  }
                  onClick={closeMobile}
                >
                  <span className="sidebar__nav-icon">
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="sidebar__nav-text">
                      {item.name}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {!isCollapsed && (
          <div className="sidebar__footer">
            <div className="sidebar__user">
              <div className="sidebar__user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div className="sidebar__user-info">
                <p className="sidebar__user-name">{user?.name}</p>
                <p className="sidebar__user-email">{user?.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;