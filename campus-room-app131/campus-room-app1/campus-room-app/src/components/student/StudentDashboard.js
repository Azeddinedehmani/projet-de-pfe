import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useProfileLoader from '../../hooks/useProfileLoader'; // Add this import
import RoomReservation from './RoomReservation';
import StudentMyReservations from './StudentMyReservations';
import Profile from '../common/Profile';
import NotificationPanel from '../common/NotificationPanel';
import NotificationService from '../../services/NotificationService';
import StudentTimetable from './StudentTimetable';
import { API } from '../../api';

import '../../styles/dashboard.css';
import '../../styles/notifications.css';

// Component imports
import SideNav from '../common/SideNav';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Add this line to load profile data immediately after login
  const { isProfileLoaded } = useProfileLoader();
  
  // UI State
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data State
  const [myReservations, setMyReservations] = useState([]);
  const [studyRooms, setStudyRooms] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [weeklyStudyHours, setWeeklyStudyHours] = useState('00h 00min');
  const [dashboardStats, setDashboardStats] = useState({
    activeReservations: 0,
    totalReservations: 0,
    weeklyStudyHours: '00h 00min',
    todayClasses: 0
  });

  // Log profile loading status
  useEffect(() => {
    console.log('Profile loaded status:', isProfileLoaded);
    console.log('Current user profile image:', currentUser?.profileImageUrl);
  }, [isProfileLoaded, currentUser?.profileImageUrl]);

  // Helper function to get start of week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Helper function to format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Handle different time formats
    if (typeof timeString === 'string') {
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
        return timeString.split(':').slice(0, 2).join(':');
      }
    }
    
    return String(timeString);
  };

  // Helper function to convert time to minutes
  const convertTimeToMinutes = (timeString) => {
    if (!timeString) return 0;
    
    try {
      // Handle different time formats
      let cleanTime = timeString.toString().trim();
      
      // Remove any extra characters and normalize
      if (cleanTime.includes('T')) {
        // Handle ISO format like "2024-01-01T14:30:00"
        cleanTime = cleanTime.split('T')[1].split('.')[0];
      }
      
      // Extract hours and minutes
      const timeParts = cleanTime.split(':');
      if (timeParts.length < 2) {
        console.warn(`Invalid time format: ${timeString}`);
        return 0;
      }
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      // Validate the parsed values
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`Invalid time values: ${timeString} -> hours: ${hours}, minutes: ${minutes}`);
        return 0;
      }
      
      const totalMinutes = (hours * 60) + minutes;
      console.log(`Converting time ${timeString} to ${totalMinutes} minutes (${hours}h ${minutes}m)`);
      
      return totalMinutes;
    } catch (error) {
      console.error(`Error parsing time ${timeString}:`, error);
      return 0;
    }
  };

  // Calculate dashboard statistics from current data
  const calculateDashboardStats = useCallback((reservations = [], classes = []) => {
    try {
      const activeReservations = reservations.filter(r => 
        r.status.toLowerCase() === 'approved'
      ).length;
      
      const totalReservations = reservations.length;
      
      // Calculate weekly study hours from approved reservations
      const weekStart = getStartOfWeek(new Date());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999); // End of the week day
      
      console.log('=== WEEKLY STUDY HOURS CALCULATION ===');
      console.log('Week range:', weekStart.toDateString(), 'to', weekEnd.toDateString());
      console.log('Total reservations to check:', reservations.length);
      
      // Filter approved reservations for this week
      const thisWeekApprovedReservations = reservations.filter(r => {
        if (!r.date) {
          console.log(`Skipping reservation ${r.id}: no date`);
          return false;
        }
        
        if (r.status.toLowerCase() !== 'approved') {
          console.log(`Skipping reservation ${r.id}: status is ${r.status}, not approved`);
          return false;
        }
        
        const resDate = new Date(r.date);
        const isInWeek = resDate >= weekStart && resDate <= weekEnd;
        
        console.log(`Reservation ${r.id}: Date ${r.date} (${resDate.toDateString()}), Status: ${r.status}, In week: ${isInWeek}`);
        
        return isInWeek;
      });
      
      console.log(`Found ${thisWeekApprovedReservations.length} approved reservations for this week:`, thisWeekApprovedReservations);
      
      // Calculate total hours from these reservations
      const weeklyHours = thisWeekApprovedReservations.reduce((total, reservation) => {
        let hours = 0;
        
        console.log(`\nProcessing reservation ${reservation.id}:`);
        console.log(`- Room: ${reservation.room}`);
        console.log(`- Date: ${reservation.date}`);
        console.log(`- Time: ${reservation.time}`);
        console.log(`- StartTime: ${reservation.startTime}`);
        console.log(`- EndTime: ${reservation.endTime}`);
        
        if (reservation.startTime && reservation.endTime) {
          const start = convertTimeToMinutes(reservation.startTime);
          const end = convertTimeToMinutes(reservation.endTime);
          
          console.log(`- Start minutes: ${start}, End minutes: ${end}`);
          
          if (end > start) {
            hours = (end - start) / 60;
            console.log(`- Duration: ${hours} hours (from startTime/endTime)`);
          } else {
            console.warn(`- Invalid time range: ${reservation.startTime} - ${reservation.endTime}`);
          }
          
        } else if (reservation.time && reservation.time.includes(' - ')) {
          const timeParts = reservation.time.split(' - ');
          if (timeParts.length === 2) {
            const startTime = timeParts[0].trim();
            const endTime = timeParts[1].trim();
            const start = convertTimeToMinutes(startTime);
            const end = convertTimeToMinutes(endTime);
            
            console.log(`- Parsed from time field: ${startTime} (${start}min) to ${endTime} (${end}min)`);
            
            if (end > start) {
              hours = (end - start) / 60;
              console.log(`- Duration: ${hours} hours (from time field)`);
            } else {
              console.warn(`- Invalid time range: ${startTime} - ${endTime}`);
            }
          }
        } else {
          console.log(`- Could not parse time information`);
        }
        
        console.log(`- Hours to add: ${hours}`);
        const newTotal = total + Math.max(0, hours);
        console.log(`- Running total: ${total} + ${hours} = ${newTotal}`);
        
        return newTotal;
      }, 0);
      
      console.log(`\n=== FINAL CALCULATION ===`);
      console.log(`Total weekly study hours: ${weeklyHours}`);
      
      // Format hours to "00h 00min" format
      const formatHoursToHourMin = (totalHours) => {
        const positiveHours = Math.max(0, totalHours);
        const hours = Math.floor(positiveHours);
        const minutes = Math.round((positiveHours - hours) * 60);
        const formatted = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}min`;
        console.log(`Formatted ${totalHours} hours as: ${formatted}`);
        return formatted;
      };
      
      const stats = {
        activeReservations,
        totalReservations,
        weeklyStudyHours: formatHoursToHourMin(weeklyHours),
        todayClasses: classes.length
      };
      
      console.log('Final stats:', stats);
      console.log('=== END CALCULATION ===\n');
      
      setDashboardStats(stats);
      setWeeklyStudyHours(stats.weeklyStudyHours);
      
      return stats;
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      return {
        activeReservations: 0,
        totalReservations: 0,
        weeklyStudyHours: '00h 00min',
        todayClasses: 0
      };
    }
  }, []);

  // Fetch student's reservations
  const fetchMyReservations = async () => {
    try {
      let response;
      if (API.studentAPI && API.studentAPI.getMyReservations) {
        response = await API.studentAPI.getMyReservations();
      } else {
        response = await API.get('/api/student/my-reservations');
      }
      
      const formattedReservations = response.data.map(res => ({
        id: res.id || '',
        room: res.classroom || res.room || '',
        date: res.date || '',
        time: res.time || `${res.startTime || ''} - ${res.endTime || ''}`,
        startTime: res.startTime || '',
        endTime: res.endTime || '',
        purpose: res.purpose || '',
        notes: res.notes || '',
        status: res.status || 'Pending',
        classroomId: res.classroomId || ''
      }));
      
      setMyReservations(formattedReservations);
      
      // Update localStorage as backup
      localStorage.setItem('studentReservations', JSON.stringify(formattedReservations));
      
      return formattedReservations;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      
      // Fallback to localStorage
      const storedReservations = localStorage.getItem('studentReservations');
      if (storedReservations) {
        const parsedReservations = JSON.parse(storedReservations);
        setMyReservations(parsedReservations);
        return parsedReservations;
      }
      
      return [];
    }
  };

  // Fetch available study rooms
  const fetchAvailableRooms = async () => {
    try {
      const response = await API.get('/api/rooms/classrooms');
      setStudyRooms(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching study rooms:', error);
      
      // Fallback to stored rooms or default
      const storedRooms = localStorage.getItem('availableClassrooms');
      if (storedRooms) {
        const parsedRooms = JSON.parse(storedRooms);
        setStudyRooms(parsedRooms);
        return parsedRooms;
      }
      
      return [];
    }
  };

  // Fetch today's classes from timetable
  const fetchTodayClasses = async () => {
    try {
      if (!currentUser) return [];
      
      const response = await API.timetableAPI.getMyTimetable();
      const timetableEntries = response.data || [];
      
      // Get today's day of the week
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      
      // Filter for today's classes
      const todaysClasses = timetableEntries
        .filter(entry => entry.day === today)
        .map(entry => ({
          id: entry.id,
          name: entry.name || 'Unnamed Course',
          time: `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`,
          location: entry.location || 'TBD',
          instructor: entry.instructor || 'Not assigned',
          type: entry.type || 'Lecture'
        }))
        .sort((a, b) => {
          // Sort by start time
          const timeA = convertTimeToMinutes(a.time.split(' - ')[0]);
          const timeB = convertTimeToMinutes(b.time.split(' - ')[0]);
          return timeA - timeB;
        });
      
      setTodayClasses(todaysClasses);
      return todaysClasses;
    } catch (error) {
      console.error('Error fetching today\'s classes:', error);
      setTodayClasses([]);
      return [];
    }
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch reservations and classes first
      const [reservations, rooms, classes] = await Promise.all([
        fetchMyReservations(),
        fetchAvailableRooms(),
        fetchTodayClasses()
      ]);
      
      // Calculate stats with the fresh data
      calculateDashboardStats(reservations, classes);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Some information may be outdated.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, calculateDashboardStats]);

  // Initialize component
  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
      fetchNotificationCount();
    }
  }, [currentUser, fetchDashboardData]);

  // Set up periodic data refresh
  useEffect(() => {
    if (!currentUser) return;
    
    // Refresh data every 5 minutes
    const dataRefreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    // Refresh notifications every minute
    const notificationInterval = setInterval(() => {
      fetchNotificationCount();
    }, 60 * 1000);
    
    return () => {
      clearInterval(dataRefreshInterval);
      clearInterval(notificationInterval);
    };
  }, [currentUser, fetchDashboardData]);

  // Update stats when data changes
  useEffect(() => {
    if (myReservations.length >= 0 && todayClasses.length >= 0) {
      calculateDashboardStats(myReservations, todayClasses);
    }
  }, [myReservations, todayClasses, calculateDashboardStats]);

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setNotificationCount(count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
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
    navigate('/student/reservations');
  };

  const cancelReservation = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        // Try using the API service
        if (API.studentAPI && API.studentAPI.cancelReservation) {
          await API.studentAPI.cancelReservation(id);
        } else {
          await API.put(`/api/student/reservations/${id}/cancel`);
        }
        
        // Refresh data after cancellation
        const updatedReservations = await fetchMyReservations();
        calculateDashboardStats(updatedReservations, todayClasses);
        
        alert('Reservation cancelled successfully.');
      } catch (error) {
        console.error('Error cancelling reservation:', error);
        alert('Failed to cancel reservation. Please try again later.');
      }
    }
  };

  // Open reservation modal for a specific room
  const openReservationModal = (room) => {
    setSelectedRoom(room);
    setShowReserveModal(true);
  };

  // Create a new reservation
  const createReservation = async (formData) => {
    try {
      const { roomName, date, time, purpose, numberOfPeople, notes } = formData;
      
      // Parse time range
      const [startTime, endTime] = time.split(' - ');
      
      const reservationData = {
        classroomId: selectedRoom.id,
        date: date,
        startTime: startTime,
        endTime: endTime,
        purpose: purpose,
        notes: notes || '',
        capacity: numberOfPeople
      };
      
      // Submit reservation
      if (API.studentAPI && API.studentAPI.requestClassroomReservation) {
        await API.studentAPI.requestClassroomReservation(reservationData);
      } else {
        await API.post('/api/student/classroom-reservations/request', reservationData);
      }
      
      // Refresh data after creating reservation
      const updatedReservations = await fetchMyReservations();
      calculateDashboardStats(updatedReservations, todayClasses);
      
      // Close modal
      setShowReserveModal(false);
      
      alert(`Reservation request submitted for ${roomName} on ${date} at ${time}. Pending approval.`);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to submit reservation. Please try again.');
    }
  };

  // Get upcoming reservations (next 3)
  const getUpcomingReservations = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return myReservations
      .filter(r => {
        const resDate = new Date(r.date);
        return resDate >= today && r.status.toLowerCase() !== 'canceled';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  };

  // Content for the main dashboard view
  const DashboardHome = () => (
    <div className="main-content">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h2>Welcome, {currentUser?.firstName || 'Student'}!</h2>
        <p>Reserve study rooms and manage your academic schedule here.</p>
        {error && (
          <div className="alert alert-warning">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
        {/* Profile loader status indicator */}
        {!isProfileLoaded && (
          <div className="profile-loading-indicator">
            <small>Loading complete profile data...</small>
          </div>
        )}
      </div>
      
      {/* Stats Cards */}
      <div className="stats-container">
        <StatCard
          icon="fas fa-calendar-check"
          title="Active Reservations"
          value={loading ? '...' : dashboardStats.activeReservations}
          color="blue"
          description="Approved reservations"
        />
        <StatCard
          icon="fas fa-clock"
          title="Study Hours This Week"
          value={loading ? '...' : dashboardStats.weeklyStudyHours}
          color="green"
          description="Hours in approved bookings"
        />
        <StatCard
          icon="fas fa-history"
          title="Total Reservations"
          value={loading ? '...' : dashboardStats.totalReservations}
          color="yellow"
          description="All time reservations"
        />
        <StatCard
          icon="fas fa-calendar-day"
          title="Classes Today"
          value={loading ? '...' : dashboardStats.todayClasses}
          color="red"
          description="Scheduled for today"
        />
      </div>
      
      {/* Rest of the dashboard content remains the same... */}
      {/* Upcoming Reservations Section */}
      <div className="section">
        <div className="section-header">
          <h2>My Upcoming Reservations</h2>
          <Link to="/student/reservations" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading reservations...</p>
          </div>
        ) : getUpcomingReservations().length === 0 ? (
          <div className="no-data-message">
            <p>No upcoming reservations. <Link to="/student/reserve">Make your first reservation</Link></p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getUpcomingReservations().map(reservation => (
                  <tr key={reservation.id}>
                    <td>{reservation.room}</td>
                    <td>{new Date(reservation.date).toLocaleDateString()}</td>
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
                        {(reservation.status.toLowerCase() === 'pending' || reservation.status.toLowerCase() === 'approved') && (
                          <button 
                            className="btn-table btn-delete"
                            onClick={() => cancelReservation(reservation.id)}
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
          </div>
        )}
      </div>
      
      {/* Today's Classes Section */}
      <div className="section">
        <div className="section-header">
          <h2>Today's Classes</h2>
          <Link to="/student/timetable" className="view-all-link">
            View Full Schedule <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading today's classes...</p>
          </div>
        ) : todayClasses.length === 0 ? (
          <div className="no-data-message">
            <p>No classes scheduled for today. <Link to="/student/timetable">View your full timetable</Link></p>
          </div>
        ) : (
          <div className="today-classes">
            {todayClasses.map(classItem => (
              <div className="class-card" key={classItem.id}>
                <div className="class-time">{classItem.time}</div>
                <div className="class-details">
                  <h3 className="class-name">{classItem.name}</h3>
                  <p className="class-location">
                    <i className="fas fa-map-marker-alt"></i> {classItem.location}
                  </p>
                  <p className="class-instructor">
                    <i className="fas fa-user"></i> {classItem.instructor}
                  </p>
                  <p className="class-type">
                    <i className="fas fa-tag"></i> {classItem.type}
                  </p>
                </div>
                <div className="class-actions">
                  <Link to="/student/timetable" className="btn-small">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Available Study Spaces Section */}
      <div className="section">
        <div className="section-header">
          <h2>Available Study Spaces</h2>
          <Link to="/student/reserve" className="view-all-link">
            View All <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading study spaces...</p>
          </div>
        ) : studyRooms.length === 0 ? (
          <div className="no-data-message">
            <p>No study spaces available at the moment.</p>
          </div>
        ) : (
          <div className="rooms-grid" id="available-rooms">
            {studyRooms.slice(0, 6).map(room => (
              <div className="room-card" key={room.id}>
                <div 
                  className="room-image" 
                  style={{ backgroundImage: `url(${room.image || '/images/classroom-default.jpg'})` }}
                >
                  <span className="status-badge status-available">Available</span>
                </div>
                <div className="room-details">
                  <h3>{room.roomNumber || room.name}</h3>
                  <p><i className="fas fa-users"></i> Capacity: {room.capacity} people</p>
                  <p><i className="fas fa-list"></i> Type: {room.type}</p>
                  {room.features && (
                    <p><i className="fas fa-star"></i> Features: {Array.isArray(room.features) ? room.features.join(', ') : room.features}</p>
                  )}
                </div>
                <button 
                  className="btn-primary reserve-btn"
                  onClick={() => openReservationModal(room)}
                >
                  Reserve
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Sidebar navigation links
  const navLinks = [
    { to: '/student', icon: 'fas fa-tachometer-alt', text: 'Dashboard', exact: true },
    { to: '/student/reserve', icon: 'fas fa-calendar-plus', text: 'Reserve Study Room' },
    { to: '/student/reservations', icon: 'fas fa-calendar-check', text: 'My Reservations' },
    { to: '/student/timetable', icon: 'fas fa-calendar-week', text: 'Emploi du temps', exact: false },
    { to: '/student/profile', icon: 'fas fa-user', text: 'Profile' }
  ];

  return (
    <div className="dashboard">
      <SideNav 
        title="CampusRoom"
        logoSrc="/images/logo.png"
        navLinks={navLinks}
        onLogout={handleLogout}
        currentUser={currentUser}
        userRole="Student"
        notificationCount={notificationCount}
      />
      
      <div className="content-wrapper">
        <div className="header">
          <h1>Student Dashboard</h1>
          <div className="header-actions">
            <button 
              className="btn-secondary refresh-btn"
              onClick={fetchDashboardData}
              disabled={loading}
              title="Refresh dashboard data"
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            </button>
            <div className="notification-bell-wrapper">
              <button 
                className="btn-notification" 
                onClick={toggleNotifications}
                title="View notifications"
              >
                <i className="fas fa-bell"></i>
                {notificationCount > 0 && (
                  <span className="notification-count">{notificationCount}</span>
                )}
              </button>
            </div>
            <div className="user-info">
              <span className="role-badge">Student</span>
              <span>{currentUser?.firstName} {currentUser?.lastName}</span>
            </div>
          </div>
        </div>
        
        {/* Notifications Panel */}
        {showNotifications && (
          <div className="notifications-container">
            <NotificationPanel userRole="student" />
          </div>
        )}
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/reserve" element={<RoomReservation rooms={studyRooms} onReserve={openReservationModal} />} />
          <Route path="/reservations" element={<StudentMyReservations />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/timetable" element={<StudentTimetable />} />
        </Routes>
      </div>
      
      {/* Room Reservation Modal */}
      <Modal 
        show={showReserveModal} 
        onClose={() => setShowReserveModal(false)}
        title="Reserve Room"
      >
        {selectedRoom && (
          <form 
            id="student-reserve-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = {
                roomName: selectedRoom.roomNumber || selectedRoom.name,
                date: e.target.date.value,
                time: `${e.target.startTime.value} - ${e.target.endTime.value}`,
                purpose: e.target.purpose.value,
                numberOfPeople: e.target.numberOfPeople.value,
                notes: e.target.notes.value
              };
              createReservation(formData);
            }}
          >
            <div className="selected-room-info">
              <h4>Selected Room: {selectedRoom.roomNumber || selectedRoom.name}</h4>
              <p>Type: {selectedRoom.type} | Capacity: {selectedRoom.capacity} people</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="reservation-date">Date *</label>
              <input 
                type="date" 
                id="reservation-date" 
                name="date" 
                min={new Date().toISOString().split('T')[0]}
                required 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-time">Start Time *</label>
                <input type="time" id="start-time" name="startTime" required />
              </div>
              <div className="form-group">
                <label htmlFor="end-time">End Time *</label>
                <input type="time" id="end-time" name="endTime" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="purpose">Purpose *</label>
              <select id="purpose" name="purpose" required>
                <option value="">Select Purpose</option>
                <option value="Individual Study">Individual Study</option>
                <option value="Group Study">Group Study</option>
                <option value="Project Work">Project Work</option>
                <option value="Meeting">Meeting</option>
                <option value="Exam Preparation">Exam Preparation</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="number-of-people">Number of People *</label>
              <input 
                type="number" 
                id="number-of-people" 
                name="numberOfPeople" 
                min="1" 
                max={selectedRoom.capacity}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="additional-notes">Additional Notes</label>
              <textarea id="additional-notes" name="notes" rows="3"></textarea>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Reservation'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StudentDashboard;