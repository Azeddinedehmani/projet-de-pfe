import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import LocalImage from './LocalImage';
import '../../styles/unifié.css';


const SideNav = ({
  title,
  logoSrc,
  navLinks,
  onLogout,
  currentUser,
  userRole,
  notificationCount = 0,
  collapsed = false,
  onToggleCollapse
}) => {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Helper function to get user initials
  const getUserInitials = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
    }
    return userRole.charAt(0).toUpperCase();
  };

  // Toggle sidebar collapse
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onToggleCollapse?.(newCollapsedState);
  };

  // Handle mobile sidebar
  const handleMobileToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && !event.target.closest('.sidebar-nav')) {
        setIsMobileOpen(false);
      }
    };

    if (isMobileOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  // Handle escape key for mobile
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  // Get user full name
  const getUserFullName = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    return userRole || 'User';
  };

  // Handle logout with confirmation
  const handleLogout = (event) => {
    event.preventDefault();
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      onLogout();
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-sidebar-toggle"
        onClick={handleMobileToggle}
        aria-label="Toggle navigation"
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1001,
          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          width: '48px',
          height: '48px',
          fontSize: '1.25rem',
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        <i className={isMobileOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
      </button>

      <nav 
        className={`sidebar-nav ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <img 
            src="/image/logo.png"
            alt="logo"
            className="sidebar-logo"
            onError={(e) => {
              e.target.src = "/image/pfe-logo.png";
            }}
          />
          {!isCollapsed && (
            <h2>
              {title.substring(0, title.length - 4)}
              <span>{title.substring(title.length - 4)}</span>
            </h2>
          )}
        </div>

        {/* Toggle Button */}
        <button 
          className="sidebar-toggle"
          onClick={handleToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        {/* User Profile Section */}
        <div className="user-profile">
          <div className="user-avatar">
            {currentUser?.profileImageUrl ? (
              <div className="avatar-image-container">
                <LocalImage
                  src={currentUser.profileImageUrl}
                  alt={getUserFullName()}
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
          
          {!isCollapsed && (
            <div className="user-info">
              <div className="user-name" title={getUserFullName()}>
                {getUserFullName()}
              </div>
              <div className="user-role">{userRole}</div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <ul className="nav-menu" role="menubar">
          {navLinks.map((link, index) => (
            <li 
              className="nav-item" 
              key={index}
              role="none"
              style={{ '--item-index': index }}
              data-tooltip={isCollapsed ? link.text : ''}
            >
              <NavLink
                to={link.to}
                className={({ isActive }) => isActive ? 'active' : ''}
                end={link.exact}
                role="menuitem"
                aria-label={link.text}
                onClick={() => setIsMobileOpen(false)} // Close mobile menu on navigation
              >
                <i className={link.icon} aria-hidden="true"></i>
                {!isCollapsed && <span className="nav-text">{link.text}</span>}
                
                {/* Notification badge for Demands */}
                {link.text === 'Demands' && notificationCount > 0 && (
                  <span 
                    className="notification-badge"
                    aria-label={`${notificationCount} unread notifications`}
                    title={`${notificationCount} new ${notificationCount === 1 ? 'notification' : 'notifications'}`}
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
          
          {/* Logout Section */}
          <li className="nav-item logout" role="none">
            <a 
              href="#" 
              onClick={handleLogout}
              role="menuitem"
              aria-label="Logout"
              data-tooltip={isCollapsed ? 'Logout' : ''}
            >
              <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
              {!isCollapsed && <span className="nav-text">Logout</span>}
            </a>
          </li>
        </ul>
      </nav>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            backdropFilter: 'blur(4px)'
          }}
        />
      )}

      {/* Responsive CSS for mobile toggle */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .mobile-sidebar-toggle {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
          
          .mobile-sidebar-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4) !important;
          }
        }
      `}</style>
    </>
  );
};

export default SideNav;