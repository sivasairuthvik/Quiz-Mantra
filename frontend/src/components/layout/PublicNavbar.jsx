import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './PublicNavbar.css';

const PublicNavbar = () => {
  return (
    <header className="pnav">
      <div className="pnav__container">
        <div className="pnav__brand">
          <Link to="/" className="pnav__logo">Quiz Mantra</Link>
        </div>
        <nav className="pnav__nav" aria-label="Primary">
          <a className="pnav__link" href="#features">Features</a>
          <a className="pnav__link" href="#how">How it works</a>
          <a className="pnav__link" href="#contact">Contact</a>
        </nav>
        {/* Auth actions removed, use Navbar for auth logic */}
      </div>
    </header>
  );
};

export default PublicNavbar;
