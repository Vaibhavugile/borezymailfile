import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css'; // Import the CSS file for Sidebar

const Sidebar = ({isOpen}) => {
  const location = useLocation();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav>
        <ul>
          <li className="sidebar-greeting1">Welcome User,</li>
          <li className="sidebar-greeting">Leads</li>
          <li className={`sidebar-link ${location.pathname === '/leads' ? 'active' : ''}`}>
            <Link to="/leads" > All Leads </Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/fresh-leads' ? 'active' : ''}`}>
            <Link to="/leads/fresh-leads" > Fresh lead </Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/detail-shared' ? 'active' : ''}`}>
            <Link to="/leads/detail-shared" > Detail Shared </Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/demo-scheduled' ? 'active' : ''}`}>
            <Link to="/leads/demo-scheduled" > Demo Sheduled </Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/demo-done' ? 'active' : ''}`}>
            <Link to="/leads/demo-done">Demo Done</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/lead-won' ? 'active' : ''}`}>
            <Link to="/leads/lead-won">Lead Won</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/leads/lead-lost' ? 'active' : ''}`}>
            <Link to="/leads/lead-lost">Lead Lost</Link>
          </li>
          <li className="sidebar-greeting">Clients</li>
          <li className={`sidebar-link ${location.pathname === '/admin-dashboard' ? 'active' : ''}`}>
            <Link to="/admin-dashboard">Show All</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
