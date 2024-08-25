import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './UseSidebar.css';

const UserSidebar = ({ isOpen }) => {
  const location = useLocation();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav>
        <ul>
          <li className="sidebar-greeting1">Welcome Back User,</li>
          <li className="sidebar-greeting">Track Your Progress Here </li>
          <li>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
              Profile
            </Link>
          </li>
          <li>
            <Link to="/user" className={location.pathname === '/user' ? 'active' : ''}>
              user
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default UserSidebar;
