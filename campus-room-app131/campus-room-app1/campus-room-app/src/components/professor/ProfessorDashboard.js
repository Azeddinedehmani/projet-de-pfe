import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useProfileLoader from '../../hooks/useProfileLoader'; // Add this import
import ClassroomReservation from './ClassroomReservation';
import ClassSchedule from './ClassSchedule';
import ProfessorTimetable from './ProfessorTimetable';
import MyReservations from './MyReservations';
import NotificationService from '../../services/NotificationService';
import NotificationPanel from '../common/NotificationPanel';
import '../../styles/dashboard.css';
import '../../styles/notifications.css';
import Profile from '../common/Profile';
import { API } from '../../api';

// Component imports
import SideNav from '../common/SideNav';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';

const ProfessorDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add this line to load profile data immediately after login
  const { isProfileLoaded } = useProfileLoader();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  // Dynamic data states
  const [dashboardData, setDashboardData] = useState({
    myReservations: [],
    todayClasses: [],
    availableClassrooms: [],
    stats: {
      activeReservations: 0,
      upcomingClasses: 0,
      totalReservations: 0,
      pendingReservations: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Log profile loading status
  useEffect(() => {
    console.log('Professor profile loaded status:', isProfileLoaded);
    console.log('Current user profile image:', currentUser?.profileImageUrl);
  }, [isProfileLoaded, currentUser?.profileImageUrl]);

  // Check if user is authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    } else if (currentUser.role !== 'professor') {
      logout();
      navigate('/');
      alert('You do not have permission to access the professor dashboard.');
    }
  }, [currentUser, navigate, logout]);
  
  // Update page title based on current route
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    
    switch (path) {
      case 'dashboard':
        setPageTitle('Dashboard');
        break;
      case 'reservations':
        setPageTitle('Reservations');
        break;
      case 'schedule':
        setPageTitle('Class Schedule');
        break;
      case 'timetable':
        setPageTitle('Timetable');
        break;
      case 'reserve':
        setPageTitle('Reserve Classroom');
        break;
      case 'profile':
        setPageTitle('Profile');
        break;
      default:
        setPageTitle('Dashboard');
    }
  }, [location]);

  // Fetch professor's reservations
  const fetchMyReservations = useCallback(async () => {
    try {
      console.log('Fetching reservations for professor:', currentUser?.email);
      
      // Try the direct professor API endpoint first
      let response;
      try {
        response = await API.professorAPI.getProfessorReservations();
        console.log('✅ Fetched reservations from professor endpoint:', response.data?.length || 0);
      } catch (err) {
        console.log('❌ Professor endpoint failed, trying fallback');
        response = await API.professorAPI.getMyReservations();
        console.log('✅ Fetched reservations from fallback endpoint:', response.data?.length || 0);
      }
      
      const reservations = response.data || [];
      
      // Format reservations consistently
      const formattedReservations = reservations.map(res => ({
        id: res.id || '',
        classroom: res.classroom || res.roomNumber || res.room || '',
        date: res.date || '',
        time: res.time || `${res.startTime || ''} - ${res.endTime || ''}`,
        startTime: res.startTime || '',
        endTime: res.endTime || '',
        purpose: res.purpose || '',
        notes: res.notes || '',
        status: res.status || 'Pending',
        classroomId: res.classroomId || ''
      }));

      // Update localStorage as backup
      localStorage.setItem('professorReservations', JSON.stringify(formattedReservations));
      
      return formattedReservations;
    } catch (error) {
      console.error('❌ Error fetching reservations:', error);
      
      // Fallback to localStorage
      const stored = localStorage.getItem('professorReservations');
      const fallbackReservations = stored ? JSON.parse(stored) : [];
      console.log('📱 Using localStorage fallback:', fallbackReservations.length, 'reservations');
      return fallbackReservations;
    }
  }, [currentUser]);

  // Fetch professor's timetable
  const fetchMyTimetable = useCallback(async () => {
    try {
      console.log('Fetching timetable for professor:', currentUser?.email);
      
      let response;
      try {
        // Try the timetable API first
        response = await API.timetableAPI.getMyTimetable();
        console.log('✅ Fetched timetable from timetable API:', response.data);
      } catch (err) {
        console.log('❌ Timetable API failed, trying direct professor endpoint');
        // Try direct API call as fallback
        response = await API.get('/professor/timetable');
        console.log('✅ Fetched timetable from professor endpoint:', response.data);
      }
      
      return response.data || {};
    } catch (error) {
      console.error('❌ Error fetching timetable:', error);
      return {};
    }
  }, [currentUser]);

  // Calculate pending reservations for the professor
  const calculatePendingReservations = (reservations) => {
    if (!Array.isArray(reservations)) return 0;
    
    const pendingCount = reservations.filter(reservation => 
      reservation.status?.toLowerCase() === 'pending'
    ).length;
    
    console.log('📋 Pending reservations:', pendingCount);
    return pendingCount;
  };

  // Fetch available classrooms
  const fetchAvailableClassrooms = useCallback(async () => {
    try {
      const response = await API.roomAPI.getAllClassrooms();
      console.log('✅ Fetched classrooms:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching classrooms:', error);
      
      // Try from localStorage as fallback
      const stored = localStorage.getItem('availableClassrooms');
      const fallbackClassrooms = stored ? JSON.parse(stored) : [];
      console.log('📱 Using localStorage fallback:', fallbackClassrooms.length, 'classrooms');
      return fallbackClassrooms;
    }
  }, []);

  // Extract today's classes from timetable data
  const extractTodayClasses = (timetableData) => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let todayClasses = [];

    if (Array.isArray(timetableData)) {
      // If timetableData is an array of entries
      todayClasses = timetableData
        .filter(entry => entry.day === today)
        .map(entry => ({
          id: entry.id || `class-${Math.random().toString(36).substr(2, 9)}`,
          name: entry.name || 'Unnamed Class',
          time: `${entry.startTime || ''} - ${entry.endTime || ''}`,
          location: entry.location || 'TBD',
          type: entry.type || 'Class',
          instructor: entry.instructor || '',
          students: entry.students || 0,
          info: entry.instructor ? `Assistant: ${entry.instructor}` : undefined
        }));
    } else if (timetableData && typeof timetableData === 'object') {
      // If timetableData is grouped by day
      const todayEntries = timetableData[today] || [];
      todayClasses = todayEntries.map(entry => ({
        id: entry.id || `class-${Math.random().toString(36).substr(2, 9)}`,
        name: entry.name || 'Unnamed Class',
        time: `${entry.startTime || ''} - ${entry.endTime || ''}`,
        location: entry.location || 'TBD',
        type: entry.type || 'Class',
        instructor: entry.instructor || '',
        students: entry.students || 0,
        info: entry.instructor ? `Assistant: ${entry.instructor}` : undefined
      }));
    }

    // Sort by time
    todayClasses.sort((a, b) => {
      const timeA = a.time.split(' - ')[0] || '00:00';
      const timeB = b.time.split(' - ')[0] || '00:00';
      return timeA.localeCompare(timeB);
    });

    console.log('📅 Today\'s classes:', todayClasses.length);
    return todayClasses;
  };

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      return count;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  };

  // Comprehensive data fetch function
  const fetchProfessorDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Fetching professor dashboard data for:', currentUser.email);
      
      // Fetch all data concurrently
      const [
        myReservations,
        timetableData,
        availableClassrooms,
        notificationCount
      ] = await Promise.all([
        fetchMyReservations(),
        fetchMyTimetable(),
        fetchAvailableClassrooms(),
        fetchNotificationCount()
      ]);

      // Extract today's classes from timetable
      const todayClasses = extractTodayClasses(timetableData);

      // Calculate pending reservations
      const pendingReservations = calculatePendingReservations(myReservations);

      // Calculate dashboard statistics
      const stats = {
        activeReservations: myReservations.filter(r => 
          r.status?.toLowerCase() === 'approved' || r.status?.toLowerCase() === 'pending'
        ).length,
        upcomingClasses: todayClasses.length,
        totalReservations: myReservations.length,
        pendingReservations: pendingReservations
      };

      // Update dashboard data
      setDashboardData({
        myReservations,
        todayClasses,
        availableClassrooms,
        stats
      });

      setNotificationCount(notificationCount);
      setLastUpdateTime(new Date());
      
      console.log('✅ Dashboard data updated successfully:', {
        reservations: myReservations.length,
        todayClasses: todayClasses.length,
        pendingReservations,
        stats
      });

    } catch (error) {
      console.error('❌ Error fetching professor dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchMyReservations, fetchMyTimetable, fetchAvailableClassrooms]);

  // Initial data fetch and periodic updates
  useEffect(() => {
    if (currentUser) {
      fetchProfessorDashboardData();

      // Set up periodic refresh every 5 minutes
      const interval = setInterval(() => {
        fetchProfessorDashboardData();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [currentUser, fetchProfessorDashboardData]);

  // Manual refresh function
  const handleRefreshData = () => {
    fetchProfessorDashboardData();
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    
    // If opening notifications, mark them as read
    if (!showNotifications) {
      markNotificationsAsRead();
    }
  };
  
  // Toggle sidebar menu
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Mark notifications as read
  const markNotificationsAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotificationCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const viewReservation = (id) => {
    const reservation = dashboardData.myReservations.find(r => r.id === id);
    if (reservation) {
      alert(`Viewing reservation: ${reservation.classroom} on ${reservation.date} at ${reservation.time} for ${reservation.purpose}`);
    }
  };

  const cancelReservation = (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      const updatedReservations = dashboardData.myReservations.filter(r => r.id !== id);
      setDashboardData(prev => ({
        ...prev,
        myReservations: updatedReservations,
        stats: {
          ...prev.stats,
          activeReservations: updatedReservations.filter(r => 
            r.status?.toLowerCase() === 'approved' || r.status?.toLowerCase() === 'pending'
          ).length,
          totalReservations: updatedReservations.length,
          pendingReservations: updatedReservations.filter(r => 
            r.status?.toLowerCase() === 'pending'
          ).length
        }
      }));
      
      // Update localStorage
      localStorage.setItem('professorReservations', JSON.stringify(updatedReservations));
      alert('Reservation cancelled successfully.');
    }
  };

  // Function to handle reservation form submission
  const handleReservationSearch = (formData) => {
    const { date, startTime, endTime, classType, capacity } = formData;
    
    // Filter classrooms based on type and capacity
    const filteredRooms = dashboardData.availableClassrooms.filter(classroom => {
      return classroom.type === classType && classroom.capacity >= parseInt(capacity);
    });
    
    setReservations(filteredRooms);
    setShowModal(true);
  };

  // Function to make a reservation
  const makeReservation = (classroomId, date, time, purpose) => {
    const classroom = dashboardData.availableClassrooms.find(c => c.id === classroomId);
    if (!classroom) return;
    
    const newReservation = {
      id: `RES${Date.now()}`,
      classroom: classroom.roomNumber,
      date,
      time,
      purpose,
      status: 'Pending'
    };
    
    const updatedReservations = [...dashboardData.myReservations, newReservation];
    setDashboardData(prev => ({
      ...prev,
      myReservations: updatedReservations,
      stats: {
        ...prev.stats,
        totalReservations: updatedReservations.length,
        activeReservations: updatedReservations.filter(r => 
          r.status?.toLowerCase() === 'approved' || r.status?.toLowerCase() === 'pending'
        ).length
      }
    }));
    
    // Update localStorage
    localStorage.setItem('professorReservations', JSON.stringify(updatedReservations));
    setShowModal(false);
  };

  // Content for the main dashboard view
  const DashboardHome = () => (
    <div className="main-content">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome, {currentUser?.firstName || 'Professor'}!</h2>
          <p>Manage your classroom reservations and teaching schedule here.</p>
          {lastUpdateTime && (
            <small className="last-update">
              Last updated: {lastUpdateTime.toLocaleTimeString()}
            </small>
          )}
          {/* Profile loader status indicator */}
          {!isProfileLoaded && (
            <div className="profile-loading-indicator">
              <small>Loading complete profile data...</small>
            </div>
          )}
        </div>
        <div className="welcome-actions">
          <button 
            className="btn-secondary"
            onClick={handleRefreshData}
            disabled={loading}
            title="Refresh dashboard data"
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            {loading ? ' Updating...' : ' Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button className="btn-small" onClick={handleRefreshData}>
            Try Again
          </button>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="stats-container">
        <StatCard
          icon="fas fa-calendar-check"
          title="Active Reservations"
          value={dashboardData.stats.activeReservations}
          color="blue"
          description={`${dashboardData.stats.totalReservations} total reservations`}
        />
        <StatCard
          icon="fas fa-calendar-day"
          title="Today's Classes"
          value={dashboardData.stats.upcomingClasses}
          color="green"
          description="Classes scheduled for today"
        />
        <StatCard
          icon="fas fa-clock"
          title="Pending Reservations"
          value={dashboardData.stats.pendingReservations}
          color="yellow"
          description="Awaiting approval"
        />
        <StatCard
          icon="fas fa-history"
          title="Total Reservations"
          value={dashboardData.stats.totalReservations}
          color="red"
          description="All-time reservation requests"
        />
      </div>
      
      {/* Rest of the dashboard content remains the same... */}
      {/* Upcoming Reservations Section */}
      <div className="section">
        <div className="section-header">
          <h2>My Upcoming Reservations</h2>
          <Link to="/professor/reservations" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        {dashboardData.myReservations.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>No reservations found</p>
            <Link to="/professor/reserve" className="btn-primary">
              Make a Reservation
            </Link>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Classroom</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.myReservations.slice(0, 5).map(reservation => (
                  <tr key={reservation.id}>
                    <td>{reservation.classroom}</td>
                    <td>{reservation.date}</td>
                    <td>{reservation.time}</td>
                    <td>{reservation.purpose}</td>
                    <td>
                      <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-table btn-view"
                          onClick={() => viewReservation(reservation.id)}
                        >
                          View
                        </button>
                        <button 
                          className="btn-table btn-delete"
                          onClick={() => cancelReservation(reservation.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Today's Schedule Section */}
      <div className="section">
        <div className="section-header">
          <h2>Today's Schedule</h2>
          <div className="section-actions">
            <Link to="/professor/schedule" className="view-all-link">
              View Schedule <i className="fas fa-chevron-right"></i>
            </Link>
            <Link to="/professor/timetable" className="view-all-link">
              View Timetable <i className="fas fa-chevron-right"></i>
            </Link>
          </div>
        </div>
        
        {dashboardData.todayClasses.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar"></i>
            <p>No classes scheduled for today</p>
            <Link to="/professor/timetable" className="btn-primary">
              Manage Timetable
            </Link>
          </div>
        ) : (
          <div className="today-classes">
            {dashboardData.todayClasses.map(classItem => (
              <div className="class-card" key={classItem.id}>
                <div className="class-time">{classItem.time}</div>
                <div className="class-details">
                  <h3 className="class-name">{classItem.name}</h3>
                  <p className="class-location">
                    <i className="fas fa-map-marker-alt"></i> {classItem.location}
                  </p>
                  {classItem.students && (
                    <p className="class-info">
                      <i className="fas fa-users"></i> {classItem.students} Students
                    </p>
                  )}
                  {classItem.info && (
                    <p className="class-info">
                      <i className="fas fa-clipboard-list"></i> {classItem.info}
                    </p>
                  )}
                  <p className="class-type">
                    <i className="fas fa-tag"></i> {classItem.type}
                  </p>
                </div>
                <div className="class-actions">
                  <button className="btn-small">View Details</button>
                  {classItem.students && (
                    <button className="btn-small">Class Materials</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Reserve Classroom Section */}
      <div className="section">
        <div className="section-header">
          <h2>Reserve a Classroom</h2>
        </div>
        
        <ClassroomReservation onSubmit={handleReservationSearch} />
      </div>
    </div>
  );

  // Sidebar navigation links
  const navLinks = [
    { to: '/professor', icon: 'fas fa-tachometer-alt', text: 'Dashboard', exact: true },
    { to: '/professor/reserve', icon: 'fas fa-calendar-plus', text: 'Reserve Classroom' },
    { to: '/professor/reservations', icon: 'fas fa-calendar-check', text: 'My Reservations' },
    { to: '/professor/schedule', icon: 'fas fa-calendar-alt', text: 'Class Schedule' },
    { to: '/professor/timetable', icon: 'fas fa-calendar-week', text: 'Timetable' },
    { to: '/professor/profile', icon: 'fas fa-user', text: 'Profile' }
  ];

  return (
    <div className="dashboard">
      <SideNav 
        title="CampusRoom"
        logoSrc="/images/logo.png"
        navLinks={navLinks}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole="Professor"
        notificationCount={notificationCount}
      />
      
      <div className="content-wrapper">
        <div className="header">
          <h1>{pageTitle}</h1>
          <div className="header-actions">
            <div className="notification-bell-wrapper">
              <button 
                className="btn-notification" 
                onClick={toggleNotifications}
                title="View notifications"
              >
                <i className="fas fa-bell"></i>
                {notificationCount > 0 && (
                  <span className="header-notification-count">{notificationCount}</span>
                )}
              </button>
            </div>
            <div className="user-info">
              <span className="role-badge">Professor</span>
              <span>{currentUser?.firstName} {currentUser?.lastName}</span>
            </div>
          </div>
        </div>
        
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-container">
            <NotificationPanel userRole="professor" />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reserve" element={<ClassroomReservation onSubmit={handleReservationSearch} fullPage={true} />} />
          <Route path="/reservations" element={<MyReservations notificationCount={notificationCount} />} />
          <Route path="/schedule" element={<ClassSchedule classes={dashboardData.todayClasses} />} />
          <Route path="/timetable" element={<ProfessorTimetable />} />
          <Route path="/profile" element={<Profile />} /> 
        </Routes>
      </div>
      
      {/* Available Classrooms Modal */}
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)}
        title="Available Classrooms"
      >
        <div id="available-classrooms-list">
          {reservations.length === 0 ? (
            <div className="no-results">
              <p>No classrooms matching your criteria are available.</p>
              <p>Try adjusting your search parameters.</p>
            </div>
          ) : (
            reservations.map(classroom => (
              <div className="classroom-item" key={classroom.id}>
                <h3>{classroom.roomNumber} ({classroom.type})</h3>
                <p><strong>Capacity:</strong> {classroom.capacity} students</p>
                <p><strong>Features:</strong> {classroom.features?.join(', ') || 'None listed'}</p>
                <button 
                  className="btn-primary reserve-btn"
                  onClick={() => makeReservation(
                    classroom.id, 
                    document.getElementById('reservation-date')?.value,
                    `${document.getElementById('start-time')?.value} - ${document.getElementById('end-time')?.value}`,
                    document.getElementById('purpose')?.value
                  )}
                >
                  Reserve this room
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProfessorDashboard;