import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './UseSidebar.css'; // Import the CSS file for Sidebar
import calender from '../../assets/calendar.png';
import product from '../../assets/product.png';
import leads from '../../assets/leads.png';
import customers from '../../assets/costumer.png';
import user from '../../assets/user.png';

const UserSidebar = ({isOpen}) => {
  const location = useLocation();

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav>
        <ul>
          <li className="sidebar-greeting1">Welcome User,</li>
          <li className="sidebar-greeting">Leads</li>
          
          <li className={`sidebar-link ${location.pathname === '/usersidebar/availability' ? 'active' : ''}`}>
            <Link to="/usersidebar/availability" >
             <img src={calender} alt="Availability" className="icon" />  Availability </Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/usersidebar/leads' ? 'active' : ''}`}>
            <Link to="/usersidebar/leads" > 
            <img src={leads} alt="Leads" className="icon" /> Leads </Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/usersidebar/clients' ? 'active' : ''}`}>
            <Link to="/usersidebar/clients" > 
            <img src={customers} alt="Customers" className="icon" /> Clients </Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/addproduct' ? 'active' : ''}`}>
            <Link to="/addproduct"> 
            <img src={product} alt="Product" className="icon" />Product</Link>
          </li>
          <li className={`sidebar-link ${location.pathname === '/usersidebar/users' ? 'active' : ''}`}>
            <Link to="/usersidebar/users">
            <img src={user} alt="Users" className="icon" />Users</Link>
          </li>
          
          
        </ul>
      </nav>
    </div>
  );
};

export default UserSidebar;