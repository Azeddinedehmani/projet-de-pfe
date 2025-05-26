import React from 'react';
import { NavLink } from 'react-router-dom';
import LocalImage from './LocalImage';
import '../../styles/dashboard.css';
import '../../styles/notifications.css';

const SideNav = ({ 
  title, 
  logoSrc, 
  navLinks, 
  onLogout, 
  currentUser, 
  userRole,
  notificationCount = 0
}) => {
  
  // Helper function to get user initials
  const getUserInitials = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    return userRole.charAt(0).toUpperCase();
  };
  
  return (
    <div className="sidebar-nav">
      <div className="sidebar-header">
        <img src="/image/pfe-logo.png" alt={`${title} Logo`} className="sidebar-logo" />
        <h2>{title.substring(0, title.length - 4)}<span>{title.substring(title.length - 4)}</span></h2>
      </div>
      
      {/* User Profile Section */}
      <div className="user-profile">
        <div className="user-avatar">
          {currentUser?.profileImageUrl ? (
            <div className="avatar-image-container">
              <LocalImage 
                src={currentUser.profileImageUrl}
                alt={`${currentUser.firstName} ${currentUser.lastName}`}
                fallbackSrc="/images/default-profile.jpg"
                className="avatar-image"
              />
            </div>
          ) : (
            <div className="user-initials">
              {getUserInitials()}
            </div>
          )}
        </div>
        <div className="user-info">
          <div className="user-name">
            {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : userRole}
          </div>
          <div className="user-role">{userRole}</div>
        </div>
      </div>
      
      <ul className="nav-menu">
        {navLinks.map((link, index) => (
          <li className="nav-item" key={index}>
            <NavLink 
              to={link.to} 
              className={({ isActive }) => isActive ? 'active' : ''}
              end={link.exact}
            >
              <i className={link.icon}></i> {link.text}
              
              {/* If this is the Demands link and we have notifications, show the counter */}
              {link.text === 'Demands' && notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </NavLink>
          </li>
        ))}
        <li className="nav-item logout">
          <a href="#" onClick={onLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </a>
        </li>
      </ul>
    </div>
  );
};

export default SideNav;