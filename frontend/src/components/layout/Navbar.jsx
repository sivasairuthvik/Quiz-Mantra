import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

// Icons
const icons = {
  search: '🔍',
  bell: '🔔',
  user: '👤',
  settings: '⚙️',
  logout: '🚪',
  chevronDown: '▼',
  close: '✕'
};

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const { user, logout, isAdmin, isTeacher } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mock notifications (replace with real notifications from API)
  useEffect(() => {
    setNotifications([
      {
        id: 1,
        title: 'New Quiz Available',
        message: 'Mathematics Quiz - Advanced Level is now available',
        type: 'info',
        time: '2 minutes ago',
        read: false
      },
      {
        id: 2,
        title: 'Assignment Submitted',
        message: 'Your Physics Quiz has been submitted successfully',
        type: 'success',
        time: '1 hour ago',
        read: false
      },
      {
        id: 3,
        title: 'Deadline Reminder',
        message: 'Chemistry Quiz deadline is in 2 days',
        type: 'warning',
        time: '3 hours ago',
        read: true
      }
    ]);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
    setIsNotificationsOpen(false);
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    setIsProfileOpen(false);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="navbar">
      <div className="navbar__container">
        
        {/* Search Section */}
        <div className="navbar__search">
          <form onSubmit={handleSearch} className="navbar__search-form">
            <div className="navbar__search-input-wrapper">
              <span className="navbar__search-icon">{icons.search}</span>
              <input
                type="text"
                placeholder="Search quizzes, users, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="navbar__search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="navbar__search-clear"
                >
                  {icons.close}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Section */}
        <div className="navbar__right">
          
          {/* Notifications */}
          <div className="navbar__notifications" ref={notificationsRef}>
            <button
              className="navbar__notifications-toggle"
              onClick={toggleNotifications}
              aria-label="Toggle notifications"
            >
              <span className="navbar__notifications-icon">{icons.bell}</span>
              {unreadCount > 0 && (
                <span className="navbar__notifications-badge">{unreadCount}</span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="navbar__notifications-dropdown">
                <div className="navbar__notifications-header">
                  <h3>Notifications</h3>
                  <span className="navbar__notifications-count">
                    {unreadCount} unread
                  </span>
                </div>

                <div className="navbar__notifications-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`navbar__notification-item ${
                          !notification.read ? 'navbar__notification-item--unread' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className={`navbar__notification-type navbar__notification-type--${notification.type}`}>
                          <span className="navbar__notification-dot"></span>
                        </div>
                        <div className="navbar__notification-content">
                          <h4 className="navbar__notification-title">
                            {notification.title}
                          </h4>
                          <p className="navbar__notification-message">
                            {notification.message}
                          </p>
                          <span className="navbar__notification-time">
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="navbar__notifications-empty">
                      <p>No notifications</p>
                    </div>
                  )}
                </div>

                <div className="navbar__notifications-footer">
                  <Link to="/notifications" className="navbar__notifications-view-all">
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="navbar__profile" ref={profileRef}>
            <button
              className="navbar__profile-toggle"
              onClick={toggleProfile}
              aria-label="Toggle user menu"
            >
              <div className="navbar__profile-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              <div className="navbar__profile-info">
                <span className="navbar__profile-name">{user?.name}</span>
                <span className="navbar__profile-role">{user?.role}</span>
              </div>
              <span className="navbar__profile-chevron">{icons.chevronDown}</span>
            </button>

            {isProfileOpen && (
              <div className="navbar__profile-dropdown">
                <div className="navbar__profile-dropdown-header">
                  <div className="navbar__profile-dropdown-avatar">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="navbar__profile-dropdown-info">
                    <h4>{user?.name}</h4>
                    <p>{user?.email}</p>
                    <span className="navbar__profile-dropdown-role">{user?.role}</span>
                  </div>
                </div>

                <div className="navbar__profile-dropdown-menu">
                  <Link
                    to="/profile"
                    className="navbar__profile-dropdown-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="navbar__profile-dropdown-icon">{icons.user}</span>
                    View Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="navbar__profile-dropdown-item"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="navbar__profile-dropdown-icon">{icons.settings}</span>
                    Settings
                  </Link>

                  {(isAdmin() || isTeacher()) && (
                    <Link
                      to={isAdmin() ? "/admin/dashboard" : "/teacher/dashboard"}
                      className="navbar__profile-dropdown-item"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <span className="navbar__profile-dropdown-icon">🛠️</span>
                      {isAdmin() ? 'Admin Panel' : 'Teacher Panel'}
                    </Link>
                  )}

                  <div className="navbar__profile-dropdown-divider"></div>

                  <button
                    onClick={handleLogout}
                    className="navbar__profile-dropdown-item navbar__profile-dropdown-item--logout"
                  >
                    <span className="navbar__profile-dropdown-icon">{icons.logout}</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;