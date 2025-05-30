import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useProfileLoader from '../../hooks/useProfileLoader';
import NotificationService from '../../services/NotificationService';
import NotificationPanel from '../common/NotificationPanel';
import SharedDashboardService from '../../services/SharedDashboardService'; // Import shared service
import '../../styles/unifié.css';


// Component imports
import SideNav from '../common/SideNav';
import StatCard from '../common/StatCard';
import ReservationsList from './ReservationsList';
import UserManagement from './UserManagement';
import AdminClassrooms from './AdminClassrooms';
import AdminDemands from './AdminDemands';
import AdminReports from './AdminReports';
import AdminSettings from './AdminSettings';
import Profile from '../common/Profile';
import ClassGroupManagement from './ClassGroupManagement';

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  const { isProfileLoaded } = useProfileLoader();
  
  const [pendingNotificationCount, setPendingNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // State for dynamic dashboard data - SAME AS BEFORE
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    activeReservations: 0,
    pendingDemands: 0,
    totalUsers: 0,
    totalClassGroups: 0,
    classroomDetails: '',
    userDetails: '',
    isLoading: true
  });
  
  const [recentReservations, setRecentReservations] = useState([]);
  const [pendingDemands, setPendingDemands] = useState([]);
  const [error, setError] = useState(null);

  // Log profile loading status
  useEffect(() => {
    console.log('Admin profile loaded status:', isProfileLoaded);
    console.log('Current user profile image:', currentUser?.profileImageUrl);
  }, [isProfileLoaded, currentUser?.profileImageUrl]);
  
  // Fetch notification count on component mount
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const count = await NotificationService.getUnreadCount();
        setPendingNotificationCount(count);

        const interval = setInterval(async () => {
          const updatedCount = await NotificationService.getUnreadCount();
          setPendingNotificationCount(updatedCount);
        }, 60000);

        return () => clearInterval(interval);
      } catch (error) {
        console.error("Error fetching notification count:", error);
        setPendingNotificationCount(pendingDemands.length);
      }
    };

    fetchNotificationCount();
  }, [pendingDemands.length]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    let interval = null;
    
    if (autoRefreshEnabled) {
      interval = setInterval(() => {
        console.log('Auto-refreshing dashboard data using SharedDashboardService...');
        fetchDashboardData();
      }, 30000); // 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefreshEnabled]);

  // UPDATED: Fetch data using SharedDashboardService
  const fetchDashboardData = async () => {
    setStats(prev => ({...prev, isLoading: true}));
    setError(null);
    
    try {
      console.log('Fetching dashboard data using SharedDashboardService...');
      
      // Use the shared service instead of direct API calls
      const dashboardData = await SharedDashboardService.fetchDashboardData();
      
      // Update stats using shared service data
      setStats(dashboardData.stats);
      
      // Update recent reservations and pending demands
      setRecentReservations(dashboardData.recentReservations || []);
      setPendingDemands(dashboardData.pendingDemands || []);
      
      // Set error if any
      if (dashboardData.error) {
        setError(dashboardData.error);
      }
      
      // Update last updated timestamp
      setLastUpdated(dashboardData.lastUpdated || new Date());
      
      console.log('Dashboard data updated successfully using SharedDashboardService');
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setStats(prev => ({...prev, isLoading: false}));
    }
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    if (!showNotifications) {
      markNotificationsAsRead();
    }
  };
  
  // Mark notifications as read
  const markNotificationsAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setPendingNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleAutoRefresh = () => {
    setAutoRefreshEnabled(!autoRefreshEnabled);
  };

  // UPDATED: Approval/rejection functions now also invalidate shared cache
  const approveReservation = async (id) => {
    try {
      // Try admin endpoint first, fall back to regular endpoint
      let response;
      try {
        response = await SharedDashboardService.API?.put(`/api/admin/approve-reservation/${id}`);
      } catch (err) {
        console.log("Falling back to reservations approve endpoint");
        response = await SharedDashboardService.API?.put(`/api/reservations/${id}/approve`);
      }
      
      if (response && response.data) {
        // Update local state
        setRecentReservations(prevReservations => 
          prevReservations.map(reservation => 
            reservation.id === id ? { ...reservation, status: 'Approved' } : reservation
          )
        );
        
        setPendingDemands(prevDemands => 
          prevDemands.filter(demand => demand.id !== id)
        );
        
        setPendingNotificationCount(prev => Math.max(0, prev - 1));
        
        // Invalidate shared cache and refresh
        SharedDashboardService.invalidateCache();
        fetchDashboardData();
        
        alert('Reservation approved successfully.');
      }
    } catch (err) {
      console.error('Error approving reservation:', err);
      alert('Failed to approve reservation. Please try again.');
    }
  };

  const rejectReservation = async (id) => {
    if (window.confirm('Are you sure you want to reject this reservation?')) {
      try {
        let response;
        try {
          response = await SharedDashboardService.API?.put(`/api/admin/reject-reservation/${id}`, { 
            reason: 'Rejected by administrator' 
          });
        } catch (err) {
          console.log("Falling back to reservations reject endpoint");
          response = await SharedDashboardService.API?.put(`/api/reservations/${id}/reject`, { 
            reason: 'Rejected by administrator' 
          });
        }
        
        if (response && response.data) {
          setRecentReservations(prevReservations => 
            prevReservations.filter(reservation => reservation.id !== id)
          );
          
          setPendingDemands(prevDemands => 
            prevDemands.filter(demand => demand.id !== id)
          );
          
          setPendingNotificationCount(prev => Math.max(0, prev - 1));
          
          // Invalidate shared cache and refresh
          SharedDashboardService.invalidateCache();
          fetchDashboardData();
          
          alert('Reservation rejected successfully.');
        }
      } catch (err) {
        console.error('Error rejecting reservation:', err);
        alert('Failed to reject reservation. Please try again.');
      }
    }
  };

  // Content for the main dashboard view - SAME AS BEFORE
  const DashboardHome = () => (
    <div className="main-content">
      {error && (
        <div className="alert alert-error">
          {error}
          <button 
            className="btn-refresh ml-2"
            onClick={fetchDashboardData}
          >
            <i className="fas fa-sync-alt"></i> Retry
          </button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome, {currentUser?.firstName || 'Admin'}!</h2>
          <p>Manage the campus room booking system from this dashboard.</p>
          {!isProfileLoaded && (
            <div className="profile-loading-indicator">
              <small>Loading complete profile data...</small>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats Overview - SAME LABELS AND DATA */}
      <div className="stats-container">
        <StatCard
          icon="fas fa-chalkboard"
          title="Total Classrooms"
          value={stats.isLoading ? '...' : stats.totalClassrooms}
          color="blue"
          description={stats.isLoading ? 'Loading...' : stats.classroomDetails}
        />
        <StatCard
          icon="fas fa-calendar-check"
          title="Active Reservations"
          value={stats.isLoading ? '...' : stats.activeReservations}
          color="green"
          description={stats.isLoading ? 'Loading...' : 'Currently active reservations'}
        />
        <StatCard
          icon="fas fa-bell"
          title="Pending Demands"
          value={stats.isLoading ? '...' : stats.pendingDemands}
          color="yellow"
          description={stats.isLoading ? 'Loading...' : 'Requires your approval'}
        />
        <StatCard
          icon="fas fa-users"
          title="Total Users"
          value={stats.isLoading ? '...' : stats.totalUsers}
          color="red"
          description={stats.isLoading ? 'Loading...' : stats.userDetails}
        />
        <StatCard
          icon="fas fa-graduation-cap"
          title="Class Groups"
          value={stats.isLoading ? '...' : stats.totalClassGroups}
          color="purple"
          description={stats.isLoading ? 'Loading...' : 'Active course groups'}
        />
      </div>
      
      {/* Recent Reservations - SAME AS BEFORE */}
      <div className="section">
        <div className="section-header">
          <h2>Recent Reservations</h2>
          <Link to="/admin/reservations" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          {stats.isLoading ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>Loading reservations...</p>
            </div>
          ) : recentReservations.length === 0 ? (
            <div className="no-data-message">
              <p>No recent reservations found.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Classroom</th>
                  <th>Reserved By</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map(reservation => (
                  <tr key={reservation.id}>
                    <td>{reservation.id}</td>
                    <td>{reservation.classroom}</td>
                    <td>{reservation.reservedBy}</td>
                    <td>{reservation.role}</td>
                    <td>{reservation.date}</td>
                    <td>{reservation.time}</td>
                    <td>
                      <span className={`status-badge status-${(reservation.status || '').toLowerCase()}`}>
                        {reservation.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-table btn-view">
                          View
                        </button>
                        {(reservation.status === 'Pending' || reservation.status === 'PENDING') && (
                          <>
                            <button 
                              className="btn-table btn-edit"
                              onClick={() => approveReservation(reservation.id)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn-table btn-delete"
                              onClick={() => rejectReservation(reservation.id)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {(reservation.status === 'Approved' || reservation.status === 'APPROVED') && (
                          <button 
                            className="btn-table btn-delete"
                            onClick={() => rejectReservation(reservation.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Pending Demands - SAME AS BEFORE */}
      <div className="section">
        <div className="section-header">
          <h2>Pending Approval Demands</h2>
          <Link to="/admin/demands" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        <div className="data-table-container">
          {stats.isLoading ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>Loading pending demands...</p>
            </div>
          ) : pendingDemands.length === 0 ? (
            <div className="no-data-message">
              <p>No pending demands found.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Classroom</th>
                  <th>Requested By</th>
                  <th>Role</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingDemands.map(demand => (
                  <tr key={demand.id}>
                    <td>{demand.id}</td>
                    <td>{demand.classroom}</td>
                    <td>{demand.reservedBy || demand.requestedBy}</td>
                    <td>{demand.role}</td>
                    <td>{demand.date}</td>
                    <td>{demand.time}</td>
                    <td>{demand.purpose}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-table btn-view">
                          View
                        </button>
                        <button 
                          className="btn-table btn-edit"
                          onClick={() => approveReservation(demand.id)}
                        >
                          Approve
                        </button>
                        <button 
                          className="btn-table btn-delete"
                          onClick={() => rejectReservation(demand.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  // Sidebar navigation links - SAME AS BEFORE
  const navLinks = [
    { to: '/admin', icon: 'fas fa-tachometer-alt', text: 'Dashboard', exact: true },
    { to: '/admin/classrooms', icon: 'fas fa-chalkboard', text: 'Classrooms' },
    { to: '/admin/reservations', icon: 'fas fa-calendar-check', text: 'Reservations' },
    { to: '/admin/demands', icon: 'fas fa-bell', text: 'Demands' },
    { to: '/admin/users', icon: 'fas fa-users', text: 'Users' },
    { to: '/admin/class-groups', icon: 'fas fa-graduation-cap', text: 'Class Groups' },
    { to: '/admin/reports', icon: 'fas fa-chart-bar', text: 'Reports' },
    { to: '/admin/settings', icon: 'fas fa-cog', text: 'Settings' },
    { to: '/admin/profile', icon: 'fas fa-user', text: 'Profile' }
  ];

  return (
    <div className="dashboard">
      <SideNav 
        title="CampusRoom"
        logoSrc="/images/logo.png"
        navLinks={navLinks}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole="Admin"
        notificationCount={pendingNotificationCount}
      />
      
      <div className="content-wrapper">
        <div className="header">
          <h1>Admin Dashboard</h1>
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()} 
            </span>
          )}
          
          <div className="header-actions">
            <div className="notification-bell-wrapper">
              <button 
                className="btn-notification" 
                onClick={toggleNotifications}
                title="View notifications"
              >
                
                  <i className="fas fa-bell"></i>
               {showNotifications && (  // <-- We'll change this
  <div className="notifications-container">
    <NotificationPanel />
  </div>)}
              </button>
            </div>
            <button 
              className="action-button"
              onClick={fetchDashboardData}
              title="btn-secondary refresh-btn"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
            
           
          </div>
        </div>
        
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-container">
            <NotificationPanel userRole="admin" />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reservations" element={<ReservationsList />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/classrooms" element={<AdminClassrooms />} />
          <Route path="/demands" element={<AdminDemands />} />
          <Route path="/class-groups" element={<ClassGroupManagement />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/reports" element={<AdminReports />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;