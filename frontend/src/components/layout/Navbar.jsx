import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

// Icons
const icons = {
  user: <span role="img" aria-label="user">👤</span>,
  logout: <span role="img" aria-label="logout">🚪</span>,
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };

  const toggleProfile = () => setIsProfileOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar__container" style={{ justifyContent: 'space-between', alignItems: 'center', width: '100vw', padding: '0 32px' }}>
        {/* Left: Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/vite.svg" alt="Logo" style={{ width: 32, height: 32, marginRight: 8 }} />
          <span style={{ color: '#f3f4f6', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.5px' }}>Quiz Mantra</span>
        </div>
        {/* Right: User Profile or Login */}
        <div>
          {user ? (
            <div className="navbar__profile" ref={profileRef}>
              <button
                className="navbar__profile-toggle"
                onClick={toggleProfile}
                aria-label="Toggle user menu"
                style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <div className="navbar__profile-avatar">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#23232a', border: '1px solid #333' }} />
                  ) : (
                    <span style={{ color: '#f3f4f6', fontWeight: 700 }}>{user.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <span style={{ color: '#f3f4f6', fontWeight: 500 }}>{user.name}</span>
              </button>
              {isProfileOpen && (
                <div className="navbar__profile-dropdown">
                  <div className="navbar__profile-dropdown-header">
                    <div className="navbar__profile-dropdown-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#23232a', border: '1px solid #333' }} />
                      ) : (
                        <span style={{ color: '#f3f4f6', fontWeight: 700 }}>{user.name?.charAt(0)?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="navbar__profile-dropdown-info">
                      <h4 style={{ color: '#f3f4f6' }}>{user.name}</h4>
                      <p style={{ color: '#e0e0e0' }}>{user.email}</p>
                      <span className="navbar__profile-dropdown-role" style={{ color: '#6366f1' }}>{user.role}</span>
                    </div>
                  </div>
                  <div className="navbar__profile-dropdown-menu">
                    <Link to="/profile" className="navbar__profile-dropdown-item" onClick={() => setIsProfileOpen(false)}>
                      <span className="navbar__profile-dropdown-icon">{icons.user}</span>
                      View Profile
                    </Link>
                    <div className="navbar__profile-dropdown-divider"></div>
                    <button onClick={handleLogout} className="navbar__profile-dropdown-item navbar__profile-dropdown-item--logout">
                      <span className="navbar__profile-dropdown-icon">{icons.logout}</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="navbar__action-btn" style={{ background: '#6366f1', color: '#fff', padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: '1rem', textDecoration: 'none' }}>Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;