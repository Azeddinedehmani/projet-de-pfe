import React, { useState, useEffect } from 'react';
import { API } from '../../api';
import '../../styles/unifié.css';

// Timetable visualization component
const TimetableVisualization = ({ user }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [];
  
  // Generate time slots from 8:00 to 18:00
  for (let hour = 8; hour < 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  
  // Organize timetable entries by day
  const entriesByDay = {};
  daysOfWeek.forEach(day => {
    entriesByDay[day] = [];
  });
  
  if (user && user.timetableEntries) {
    user.timetableEntries.forEach(entry => {
      if (entriesByDay[entry.day]) {
        entriesByDay[entry.day].push(entry);
      }
    });
  }
  
  // Helper function to calculate position and height based on time
  const getEntryStyle = (entry) => {
    const startParts = entry.startTime.split(':');
    const endParts = entry.endTime.split(':');
    
    const startHour = parseInt(startParts[0]);
    const startMinute = parseInt(startParts[1]);
    const endHour = parseInt(endParts[0]);
    const endMinute = parseInt(endParts[1]);
    
    const startPosition = (startHour - 8) * 60 + startMinute;
    const duration = (endHour - startHour) * 60 + (endMinute - startMinute);
    
    return {
      top: `${startPosition / 10}px`,
      height: `${duration / 10}px`,
      backgroundColor: entry.color || '#6366f1',
    };
  };
  
  return (
    <div className="timetable-visualization">
      <div className="timetable-header">
        <div className="time-column">
          <div className="time-header">Time</div>
          {timeSlots.map(time => (
            <div key={time} className="time-slot">{time}</div>
          ))}
        </div>
        
        {daysOfWeek.map(day => (
          <div key={day} className="day-column">
            <div className="day-header">{day}</div>
            <div className="day-content">
              {entriesByDay[day].map((entry, index) => (
                <div
                  key={index}
                  className="timetable-entry"
                  style={getEntryStyle(entry)}
                >
                  <div className="entry-content">
                    <div className="entry-name">{entry.name}</div>
                    <div className="entry-time">
                      {entry.startTime} - {entry.endTime}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [viewedUser, setViewedUser] = useState(null);
  // States
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState({
    role: '',
    status: '',
    search: ''
  });
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTimetableEntries, setUserTimetableEntries] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(false);
  const [timetableError, setTimetableError] = useState(null);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    status: 'active'
  });
  const [actionInProgress, setActionInProgress] = useState(false);
  
  const [classrooms, setClassrooms] = useState([]);
  const [studyRooms, setStudyRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);

  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Class types
  const classTypes = ['Lecture', 'Lab', 'Study Group', 'Seminar', 'Tutorial'];
  
  // Available colors
  const availableColors = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Green', value: '#10b981' },
    { name: 'Blue', value: '#0ea5e9' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Pink', value: '#ec4899' }
  ];

  // Add timetable visualization styles
  useEffect(() => {
    // Add timetable visualization styles
    const style = document.createElement('style');
    style.textContent = `
      .timetable-visualization {
        margin-top: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
      }
      
      .timetable-header {
        display: flex;
        width: 100%;
      }
      
      .time-column {
        width: 80px;
        border-right: 1px solid #e5e7eb;
      }
      
      .time-header, .day-header {
        padding: 10px;
        background-color: #f9fafb;
        font-weight: bold;
        text-align: center;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .day-column {
        flex: 1;
        border-right: 1px solid #e5e7eb;
        position: relative;
      }
      
      .day-column:last-child {
        border-right: none;
      }
      
      .time-slot {
        height: 60px;
        padding: 5px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 0.75rem;
        text-align: center;
      }
      
      .day-content {
        position: relative;
        height: 600px; /* 10 time slots of 60px each */
      }
      
      .timetable-entry {
        position: absolute;
        width: 90%;
        left: 5%;
        border-radius: 4px;
        color: white;
        padding: 5px;
        font-size: 0.75rem;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .entry-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      
      .entry-name {
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .entry-time {
        font-size: 0.7rem;
      }
      
      .timetable-visualization-container {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
      
      .info-box {
        background-color: #f0f9ff;
        border: 1px solid #bfdbfe;
        border-radius: 4px;
        padding: 15px;
        margin: 15px 0;
      }
      
      .info-warning {
        background-color: #fffbeb;
        border: 1px solid #fcd34d;
      }
      
      .retry-button {
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        padding: 5px 10px;
        margin-left: 10px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      
      .retry-button:hover {
        background-color: #e5e7eb;
      }
      
      .retry-button i {
        font-size: 14px;
      }
      
      .timetable-loading {
        text-align: center;
        padding: 20px;
      }
      
      .timetable-error {
        background-color: #fee2e2;
        border-left: 4px solid #ef4444;
        padding: 12px 16px;
        margin: 16px 0;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      /* Styles for View User Modal */
      .user-details-container {
        max-height: 70vh;
        overflow-y: auto;
      }
      
      .details-section {
        margin-bottom: 25px;
        padding: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        background-color: #f9fafb;
      }
      
      .details-section h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #374151;
        font-size: 1.1rem;
        font-weight: 600;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 8px;
      }
      
      .details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 15px;
      }
      
      .detail-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .detail-item label {
        font-weight: 600;
        color: #6b7280;
        font-size: 0.9rem;
      }
      
      .detail-item span {
        color: #111827;
        font-size: 1rem;
        word-break: break-word;
      }
      
      .profile-image-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }
      
      .profile-image-preview {
        max-width: 150px;
        max-height: 150px;
        border-radius: 50%;
        border: 3px solid #e5e7eb;
        object-fit: cover;
      }
      
      .timetable-summary {
        margin-top: 10px;
      }
      
      .timetable-preview {
        margin-top: 15px;
      }
      
      .classes-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 10px;
      }
      
      .class-item {
        padding: 12px 15px;
        background-color: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .class-name {
        font-weight: 600;
        color: #111827;
        margin-bottom: 5px;
      }
      
      .class-details {
        font-size: 0.9rem;
        color: #6b7280;
      }
      
      .more-classes {
        padding: 10px 15px;
        text-align: center;
        color: #6b7280;
        font-style: italic;
        background-color: white;
        border-radius: 6px;
        border: 1px dashed #d1d5db;
      }
      
      .action-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      
      .btn-danger {
        background-color: #ef4444;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .btn-danger:hover {
        background-color: #dc2626;
      }
      
      .btn-danger:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
      }
      
      @media (max-width: 768px) {
        .details-grid {
          grid-template-columns: 1fr;
        }
        
        .action-buttons {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch classrooms from API
  const fetchClassrooms = async () => {
    try {
      setRoomsLoading(true);
      setRoomsError(null);
      
      // First try with /api/rooms/classrooms endpoint
      try {
        const response = await API.get('/api/rooms/classrooms');
        console.log('Classrooms data:', response.data);
        setClassrooms(response.data);
        return;
      } catch (error) {
        console.error('Error with first classroom endpoint, trying fallback:', error);
      }
      
      // Fallback to /classrooms endpoint
      try {
        const response = await API.get('/classrooms');
        console.log('Classrooms data (fallback):', response.data);
        setClassrooms(response.data);
        return;
      } catch (error) {
        console.error('Error with fallback classroom endpoint:', error);
      }
      
      // If all API calls fail, try to use data from localStorage
      const storedClassrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
      console.log('Using classrooms from localStorage:', storedClassrooms);
      setClassrooms(storedClassrooms);
    } catch (error) {
      console.error('Error fetching classrooms:', error);
      setRoomsError('Failed to load classrooms');
    } finally {
      setRoomsLoading(false);
    }
  };
  
  // Fetch study rooms from API
  const fetchStudyRooms = async () => {
    try {
      setRoomsLoading(true);
      setRoomsError(null);
      
      // First try with /api/rooms/study-rooms endpoint
      try {
        const response = await API.get('/api/rooms/study-rooms');
        console.log('Study rooms data:', response.data);
        setStudyRooms(response.data);
        return;
      } catch (error) {
        console.error('Error with first study room endpoint, trying fallback:', error);
      }
      
      // Fallback to /rooms/study-rooms endpoint
      try {
        const response = await API.get('/rooms/study-rooms');
        console.log('Study rooms data (fallback):', response.data);
        setStudyRooms(response.data);
        return;
      } catch (error) {
        console.error('Error with fallback study room endpoint:', error);
      }
      
      // If all API calls fail, try to use data from localStorage
      const storedStudyRooms = JSON.parse(localStorage.getItem('studyRooms') || '[]');
      console.log('Using study rooms from localStorage:', storedStudyRooms);
      setStudyRooms(storedStudyRooms);
    } catch (error) {
      console.error('Error fetching study rooms:', error);
      setRoomsError('Failed to load study rooms');
    } finally {
      setRoomsLoading(false);
    }
  };

  // Format and normalize user data to handle null values
const formatUserData = (user) => {
  return {
    ...user,
    // Ensure these values have defaults if they're null or undefined
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    role: user.role || 'student',
    status: user.status || 'inactive', // Default to inactive if status is null
    timetableEntries: user.timetableEntries || []
  };
};

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
    fetchClassrooms();
    fetchStudyRooms();
  }, []);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching users...');
      const response = await API.get('/users');
      console.log('Users response:', response.data);
      
      // Format and normalize user data
      const formattedUsers = response.data.map(formatUserData);
      
      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please check your connection and try again.');
      setLoading(false);
    }
  };

  // Handle filter input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = async () => {
    try {
      setLoading(true);
      
      // If a role filter is selected, use the API endpoint
      if (filterCriteria.role && !filterCriteria.status && !filterCriteria.search) {
        const response = await API.get(`/users/role/${filterCriteria.role}`);
        const formattedUsers = response.data.map(formatUserData);
        setFilteredUsers(formattedUsers);
      } 
      // If a status filter is selected and no role, use status endpoint
      else if (filterCriteria.status && !filterCriteria.role && !filterCriteria.search) {
        const response = await API.get(`/users/status/${filterCriteria.status}`);
        const formattedUsers = response.data.map(formatUserData);
        setFilteredUsers(formattedUsers);
      }
      // Otherwise, filter client-side for more complex filters or search
      else {
        let filtered = [...users];
        
        if (filterCriteria.role) {
          filtered = filtered.filter(user => 
            (user.role || '').toLowerCase() === filterCriteria.role.toLowerCase()
          );
        }
        
        if (filterCriteria.status) {
          filtered = filtered.filter(user => 
            (user.status || '').toLowerCase() === filterCriteria.status.toLowerCase()
          );
        }
        
        if (filterCriteria.search) {
          const searchTerm = filterCriteria.search.toLowerCase();
          filtered = filtered.filter(user => 
            (user.firstName || '').toLowerCase().includes(searchTerm) ||
            (user.lastName || '').toLowerCase().includes(searchTerm) ||
            (user.email || '').toLowerCase().includes(searchTerm)
          );
        }
        
        setFilteredUsers(filtered);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error applying filters:', error);
      setError('Error filtering users');
      setLoading(false);
    }
  };

  // Reset filters and load all users
  const resetFilters = async () => {
    setFilterCriteria({
      role: '',
      status: '',
      search: ''
    });
    
    fetchUsers();
  };

  // Handle new user form input
  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new user
  const addUser = async (e) => {
    e.preventDefault();
    
    try {
      setActionInProgress(true);
      
      // Call API to create user
      const response = await API.post('/users', newUser);
      console.log('User created:', response.data);
      
      // Add formatted user to the list
      const newUserFormatted = formatUserData(response.data);
      
      // Add to users array
      setUsers(prevUsers => [...prevUsers, newUserFormatted]);
      setFilteredUsers(prevUsers => [...prevUsers, newUserFormatted]);
      
      // Reset form and close modal
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'student',
        status: 'active'
      });
      setShowAddUserModal(false);
      setActionInProgress(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user: ' + (error.response?.data?.message || 'Unknown error'));
      setActionInProgress(false);
    }
  };

 // In UserManagement.js, replace the toggleUserStatus function with this corrected version:

const toggleUserStatus = async (userId) => {
  try {
    setActionInProgress(true);
    
    // Find the user to update
    const userToUpdate = users.find(user => user.id === userId);
    if (!userToUpdate) {
      throw new Error('User not found');
    }
    
    // Prevent status change for admin users
    if (userToUpdate.role && userToUpdate.role.toLowerCase() === 'admin') {
      alert('Cannot change status of administrator users.');
      setActionInProgress(false);
      return;
    }
    
    // Determine new status (toggle current status)
    const currentStatus = userToUpdate.status || 'inactive';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    console.log(`Changing user ${userId} status from ${currentStatus} to ${newStatus}`);
    
    // Make the API call using the correct endpoint
    const response = await API.put(`/users/${userId}/status`, {
      status: newStatus
    });
    
    console.log('Status change response:', response.data);
    
    if (response.data && response.data.success) {
      // Update local state with new status
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          return { ...user, status: newStatus };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user => matchesCurrentFilters(user)));
      
      // Update viewedUser if it's the same user
      if (viewedUser && viewedUser.id === userId) {
        setViewedUser({ ...viewedUser, status: newStatus });
      }
      
      // Show success message
      alert(response.data.message || `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } else {
      alert(response.data?.message || 'Error updating user status');
    }
  } catch (error) {
    console.error('Error toggling user status:', error);
    
    // Enhanced error handling
    let errorMessage = 'Failed to update user status: ';
    if (error.response?.data?.message) {
      errorMessage += error.response.data.message;
    } else if (error.response?.data) {
      errorMessage += typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error';
    }
    
    alert(errorMessage);
  } finally {
    setActionInProgress(false);
  }
};

  // Check if user matches current filters
  const matchesCurrentFilters = (user) => {
    // Role filter - handle null values
    if (filterCriteria.role && (user.role || '').toLowerCase() !== filterCriteria.role.toLowerCase()) {
      return false;
    }
    
    // Status filter - handle null values
    if (filterCriteria.status && (user.status || '').toLowerCase() !== filterCriteria.status.toLowerCase()) {
      return false;
    }
    
    // Search filter - handle null values
    if (filterCriteria.search) {
      const searchTerm = filterCriteria.search.toLowerCase();
      if (!(user.firstName || '').toLowerCase().includes(searchTerm) && 
          !(user.lastName || '').toLowerCase().includes(searchTerm) && 
          !(user.email || '').toLowerCase().includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  };

// Also update the deleteUser function to handle admin users properly:
const deleteUser = async (id) => {
  // Find the user to check if it's an admin
  const userToDelete = users.find(user => user.id === id);
  if (userToDelete && userToDelete.role && userToDelete.role.toLowerCase() === 'admin') {
    alert('Cannot delete administrator users.');
    return;
  }
  
  if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
    try {
      setActionInProgress(true);
      console.log('Attempting to delete user with ID:', id);
      
      // Use the direct API call
      await API.delete(`/users/${id}`);
      console.log('User deleted successfully');
      
      // Update local state
      const updatedUsers = users.filter(user => user.id !== id);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(user => matchesCurrentFilters(user)));
      
      // Close view modal if the deleted user was being viewed
      if (viewedUser && viewedUser.id === id) {
        setShowViewUserModal(false);
        setViewedUser(null);
      }
      
      // Show success message
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      
      // Enhanced error message
      let errorMessage = 'Failed to delete user: ';
      if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage += 'Bad request - user may have associated data that prevents deletion';
      } else if (error.response?.status === 403) {
        errorMessage += 'Access denied - insufficient permissions';
      } else if (error.response?.status === 404) {
        errorMessage += 'User not found or already deleted';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Unknown error occurred';
      }
      
      alert(errorMessage);
    } finally {
      setActionInProgress(false);
    }
  }
};


  // View user details - NOUVELLE FONCTION
  const viewUser = (id) => {
    const user = users.find(u => u.id === id);
    if (user) {
      setViewedUser(user);
      setShowViewUserModal(true);
    } else {
      alert('User not found');
    }
  };
  
  // Add this helper function to extract timetable entries from a response
  const extractTimetableEntries = (classGroupsResponse) => {
    if (!classGroupsResponse || !classGroupsResponse.data) return [];
    
    let entries = [];
    
    // Handle both array and single object responses
    const classGroups = Array.isArray(classGroupsResponse.data) 
      ? classGroupsResponse.data 
      : [classGroupsResponse.data];
    
    for (const classGroup of classGroups) {
      if (classGroup.timetableEntries && Array.isArray(classGroup.timetableEntries)) {
        entries = [...entries, ...classGroup.timetableEntries];
      }
    }
    
    return entries;
  };
  
  // Fetch timetable for a user - improved with better error handling
  const fetchUserTimetable = async (userId) => {
    setTimetableLoading(true);
    setTimetableError(null);
    
    try {
      console.log(`Fetching timetable for user ID: ${userId}`);
      
      // For students, first try to get enrollments from the class groups directly
      if (selectedUser && selectedUser.role && selectedUser.role.toLowerCase() === 'student') {
        try {
          // Try multiple endpoints for student enrollments
          let enrolledClassGroups = [];
          
          // First try dedicated student enrollment API if it exists
          try {
            const response = await API.get(`/api/students/${userId}/enrollments`);
            if (response.data && Array.isArray(response.data)) {
              enrolledClassGroups = response.data;
              console.log('Student enrollments found via /api/students endpoint:', enrolledClassGroups);
            }
          } catch (err) {
            console.warn('Student enrollment endpoint not available, trying alternatives');
          }
          
          // If that fails, try class-groups enrolled endpoint
          if (enrolledClassGroups.length === 0) {
            try {
              const response = await API.get(`/api/class-groups/student/${userId}`);
              if (response.data && Array.isArray(response.data)) {
                enrolledClassGroups = response.data;
                console.log('Student enrollments found via /api/class-groups/student endpoint:', enrolledClassGroups);
              }
            } catch (err) {
              console.warn('Class groups by student endpoint not available, trying alternatives');
            }
          }
          
          // If that fails, try to get all class groups and filter for student
          if (enrolledClassGroups.length === 0) {
            try {
              const response = await API.get('/api/class-groups');
              if (response.data && Array.isArray(response.data)) {
                // Filter class groups that contain the student
                enrolledClassGroups = response.data.filter(classGroup => {
                  if (!classGroup.students) return false;
                  return classGroup.students.some(student => student.id === userId);
                });
                console.log('Student enrollments found by filtering all class groups:', enrolledClassGroups);
              }
            } catch (err) {
              console.warn('Failed to get enrollments by filtering all class groups');
            }
          }
          
          // Extract timetable entries from enrolled class groups
          if (enrolledClassGroups.length > 0) {
            let combinedEntries = [];
            
            // First try to get detailed information for each class group
            for (const classGroup of enrolledClassGroups) {
              try {
                // Try to get detailed class group info with timetable entries
                const detailResponse = await API.get(`/api/class-groups/${classGroup.id}`);
                if (detailResponse.data && detailResponse.data.timetableEntries) {
                  combinedEntries = [...combinedEntries, ...detailResponse.data.timetableEntries];
                } else if (classGroup.timetableEntries) {
                  // Fallback to timetable entries in the existing class group data
                  combinedEntries = [...combinedEntries, ...classGroup.timetableEntries];
                }
              } catch (err) {
                console.warn(`Failed to get detailed class group info for ${classGroup.id}, using available data`);
                // Still try to use timetable entries from the enrollment data if available
                if (classGroup.timetableEntries) {
                  combinedEntries = [...combinedEntries, ...classGroup.timetableEntries];
                }
              }
            }
            
            // If we found any timetable entries from class groups, use them
            if (combinedEntries.length > 0) {
              console.log('Successfully compiled timetable entries from class groups:', combinedEntries);
              return combinedEntries;
            }
          }
        } catch (err) {
          console.warn('Error getting student enrollments:', err);
        }
      }
      
      // For professors, check their assigned classes
      if (selectedUser && selectedUser.role && selectedUser.role.toLowerCase() === 'professor') {
        try {
          // Try to find class groups where the professor is assigned
          let assignedClassGroups = [];
          
          // First try dedicated professor assignments API
          try {
            const response = await API.get(`/api/professors/${userId}/assignments`);
            if (response.data && Array.isArray(response.data)) {
              assignedClassGroups = response.data;
            }
          } catch (err) {
            console.warn('Professor assignments endpoint not available, trying alternatives');
          }
          
          // If that fails, try class-groups by professor endpoint
          if (assignedClassGroups.length === 0) {
            try {
              const response = await API.get(`/api/class-groups/professor/${userId}`);
              if (response.data && Array.isArray(response.data)) {
                assignedClassGroups = response.data;
              }
            } catch (err) {
              console.warn('Class groups by professor endpoint not available, trying alternatives');
            }
          }
          
          // If that fails, try to get all class groups and filter by professor
          if (assignedClassGroups.length === 0) {
            try {
              const response = await API.get('/api/class-groups');
              if (response.data && Array.isArray(response.data)) {
                // Filter class groups where this professor is assigned
                assignedClassGroups = response.data.filter(cg => cg.professorId === userId);
              }
            } catch (err) {
              console.warn('Failed to get assignments by filtering all class groups');
            }
          }
          
          // Extract timetable entries from assigned class groups
          if (assignedClassGroups.length > 0) {
            let combinedEntries = [];
            
            for (const classGroup of assignedClassGroups) {
              try {
                // Try to get detailed class group info with timetable entries
                const detailResponse = await API.get(`/api/class-groups/${classGroup.id}`);
                if (detailResponse.data && detailResponse.data.timetableEntries) {
                  combinedEntries = [...combinedEntries, ...detailResponse.data.timetableEntries];
                } else if (classGroup.timetableEntries) {
                  // Fallback to timetable entries in the existing class group data
                  combinedEntries = [...combinedEntries, ...classGroup.timetableEntries];
                }
              } catch (err) {
                console.warn(`Failed to get detailed class group info for ${classGroup.id}, using available data`);
                // Still try to use timetable entries from the assignment data if available
                if (classGroup.timetableEntries) {
                  combinedEntries = [...combinedEntries, ...classGroup.timetableEntries];
                }
              }
            }
            
            // If we found any timetable entries from class groups, use them
            if (combinedEntries.length > 0) {
              console.log('Successfully compiled timetable entries from class groups:', combinedEntries);
              return combinedEntries;
            }
          }
        } catch (err) {
          console.warn('Error getting professor assignments:', err);
        }
      }
      
      // If we couldn't get timetable from class groups, try the user timetable endpoints
      try {
        // Try dedicated timetable endpoint
        const response = await API.get(`/api/users/${userId}/timetable`);
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log('Found timetable via user timetable endpoint:', response.data);
          return response.data;
        }
      } catch (err) {
        console.warn('User timetable endpoint not available or returned no data');
      }
      
      // Try getting the user data with timetable included
      try {
        const response = await API.get(`/api/users/${userId}`);
        if (response.data && response.data.timetableEntries && response.data.timetableEntries.length > 0) {
          console.log('Found timetable in user details:', response.data.timetableEntries);
          return response.data.timetableEntries;
        }
      } catch (err) {
        console.warn('Failed to get timetable from user details');
      }
      
      // As a last resort, check the cached user data
      const userInCache = users.find(u => u.id === userId);
      if (userInCache && userInCache.timetableEntries && userInCache.timetableEntries.length > 0) {
        console.log('Using timetable from cached user data:', userInCache.timetableEntries);
        return userInCache.timetableEntries;
      }
      
      console.warn('No timetable entries found for user');
      return [];
    } catch (error) {
      console.error('Error fetching user timetable:', error);
      setTimetableError('Failed to load timetable. Please try again.');
      return [];
    } finally {
      setTimetableLoading(false);
    }
  };
  
  // Retry loading timetable
  const retryLoadTimetable = async () => {
    if (!selectedUser) return;
    
    try {
      const timetableEntries = await fetchUserTimetable(selectedUser.id);
      setUserTimetableEntries(timetableEntries);
      
      // Update the selected user with the fetched timetable entries
      setSelectedUser({
        ...selectedUser,
        timetableEntries: timetableEntries
      });
    } catch (error) {
      console.error('Error retrying timetable load:', error);
      setTimetableError('Failed to load timetable after retry. Please try again later.');
    }
  };
  
  // Open the timetable modal for a student or professor with better data fetching
  const openTimetableModal = async (user) => {
    setSelectedUser(user);
    setShowTimetableModal(true);
    setTimetableLoading(true);
    setTimetableError(null);
    
    console.log('Opening timetable modal for user:', user);
    
    try {
      // Log the user data to help debug
      console.log('User data before fetching timetable:', {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        timetableEntries: user.timetableEntries,
        hasExistingEntries: user.timetableEntries && user.timetableEntries.length > 0
      });
      
      const timetableEntries = await fetchUserTimetable(user.id);
      console.log('Fetched timetable entries:', timetableEntries);
      
      setUserTimetableEntries(timetableEntries);
      
      // Update the selected user with the fetched timetable entries
      setSelectedUser({
        ...user,
        timetableEntries: timetableEntries
      });
      
      // If we didn't find any entries but the user object had some, use those as fallback
      if (timetableEntries.length === 0 && user.timetableEntries && user.timetableEntries.length > 0) {
        console.log('Using existing timetable entries from user object as fallback');
        setUserTimetableEntries(user.timetableEntries);
        setSelectedUser({
          ...user,
          timetableEntries: user.timetableEntries
        });
      }
    } catch (error) {
      console.error('Error in openTimetableModal:', error);
      setTimetableError('Failed to load timetable. Please try again.');
      
      // If the API call fails but user has timetable entries, use those
      if (user.timetableEntries && user.timetableEntries.length > 0) {
        setUserTimetableEntries(user.timetableEntries);
      } else {
        setUserTimetableEntries([]);
      }
    } finally {
      setTimetableLoading(false);
    }
  };

  // Show loading state
  if (loading && users.length === 0) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && users.length === 0) {
    return (
      <div className="main-content">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={resetFilters}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>User Management</h2>
          <button 
            className="btn-primary"
            onClick={() => setShowAddUserModal(true)}
            disabled={actionInProgress}
          >
            <i className="fas fa-plus"></i> Add New User
          </button>
        </div>
        
        {/* Filter Section */}
        <div className="filter-container">
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select 
              id="role" 
              name="role"
              value={filterCriteria.role}
              onChange={handleFilterChange}
              disabled={loading || actionInProgress}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="professor">Professor</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select 
              id="status" 
              name="status"
              value={filterCriteria.status}
              onChange={handleFilterChange}
              disabled={loading || actionInProgress}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="search">Search</label>
            <input 
              type="text" 
              id="search" 
              name="search"
              placeholder="Search by name or email"
              value={filterCriteria.search}
              onChange={handleFilterChange}
              disabled={loading || actionInProgress}
            />
          </div>
          <button 
            className="btn-primary"
            onClick={applyFilters}
            disabled={loading || actionInProgress}
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          <button 
            className="btn-secondary"
            onClick={resetFilters}
            disabled={loading || actionInProgress}
          >
            Reset
          </button>
        </div>
        
        {/* User Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
           <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No users found</td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{`${user.firstName || ''} ${user.lastName || ''}`}</td>
                    <td>{user.email || ''}</td>
                    <td>
                      <span className="role-badge">
                        {user.role 
                          ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase() 
                          : 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${(user.status || 'inactive') === 'active' ? 'approved' : 'pending'}`}>
                        {user.status 
                          ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
                          : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-table btn-view"
                          onClick={() => viewUser(user.id)}
                          disabled={actionInProgress}
                        >
                          View
                        </button>
                        
                        {/* Only show timetable for non-admin users */}
                        {(user.role && user.role.toLowerCase() !== 'admin' && 
                          (user.role.toLowerCase() === 'student' || user.role.toLowerCase() === 'professor')) && (
                          <button 
                            className="btn-table btn-view"
                            onClick={() => openTimetableModal(user)}
                            disabled={actionInProgress}
                          >
                            View Timetable
                          </button>
                        )}
                        
                        {/* Hide activate/deactivate button for admin users */}
                        {user.role && user.role.toLowerCase() !== 'admin' && (
                          <button 
                            className="btn-table btn-edit"
                            onClick={() => toggleUserStatus(user.id)}
                            disabled={actionInProgress}
                          >
                            {(user.status || 'inactive') === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                        
                        {/* Hide delete button for admin users */}
                        {user.role && user.role.toLowerCase() !== 'admin' && (
                          <button 
                            className="btn-table btn-delete"
                            onClick={() => deleteUser(user.id)}
                            disabled={actionInProgress}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* View User Details Modal */}
      {showViewUserModal && viewedUser && (
        <div className="modal show">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>User Details</h2>
              <span 
                className="close-modal"
                onClick={() => setShowViewUserModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <div className="user-details-container">
                {/* Basic Information Section */}
                <div className="details-section">
                  <h3>Basic Information</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <label>User ID:</label>
                      <span>{viewedUser.id}</span>
                    </div>
                    <div className="detail-item">
                      <label>First Name:</label>
                      <span>{viewedUser.firstName || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Last Name:</label>
                      <span>{viewedUser.lastName || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Full Name:</label>
                      <span>{`${viewedUser.firstName || ''} ${viewedUser.lastName || ''}`.trim() || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{viewedUser.email || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Role:</label>
                      <span className="role-badge">
                        {viewedUser.role 
                          ? viewedUser.role.charAt(0).toUpperCase() + viewedUser.role.slice(1).toLowerCase() 
                          : 'Unknown'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge status-${(viewedUser.status || 'inactive') === 'active' ? 'approved' : 'pending'}`}>
                        {viewedUser.status 
                          ? viewedUser.status.charAt(0).toUpperCase() + viewedUser.status.slice(1)
                          : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                

                {/* Profile Image Section */}
                {viewedUser.profileImageUrl && (
                  <div className="details-section">
                    <h3>Profile Image</h3>
                    <div className="profile-image-container">
                      <img 
                        src={viewedUser.profileImageUrl} 
                        alt={`${viewedUser.firstName} ${viewedUser.lastName}`}
                        className="profile-image-preview"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Timetable Information Section */}
                {(viewedUser.role === 'student' || viewedUser.role === 'professor') && (
                  <div className="details-section">
                    <h3>Timetable Information</h3>
                    <div className="timetable-summary">
                      <div className="detail-item">
                        <label>Total Classes:</label>
                        <span>{viewedUser.timetableEntries ? viewedUser.timetableEntries.length : 0}</span>
                      </div>
                      {viewedUser.timetableEntries && viewedUser.timetableEntries.length > 0 && (
                        <div className="timetable-preview">
                          <h4>Upcoming Classes:</h4>
                          <div className="classes-list">
                            {viewedUser.timetableEntries.slice(0, 3).map((entry, index) => (
                              <div key={index} className="class-item" style={{borderLeft: `4px solid ${entry.color || '#6366f1'}`}}>
                                <div className="class-name">{entry.name}</div>
                                <div className="class-details">
                                  {entry.day} • {entry.startTime} - {entry.endTime}
                                  {entry.location && <span> • {entry.location}</span>}
                                </div>
                              </div>
                            ))}
                            {viewedUser.timetableEntries.length > 3 && (
                              <div className="more-classes">
                                And {viewedUser.timetableEntries.length - 3} more classes...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="details-section">
                  <h3>Actions</h3>
                  <div className="action-buttons">
                    {/* Only show these buttons for non-admin users */}
                    {viewedUser.role && viewedUser.role.toLowerCase() !== 'admin' && (
                      <>
                        <button 
                          className="btn-secondary"
                          onClick={() => toggleUserStatus(viewedUser.id)}
                          disabled={actionInProgress}
                        >
                          {(viewedUser.status || 'inactive') === 'active' ? 'Deactivate User' : 'Activate User'}
                        </button>
                        
                        {(viewedUser.role.toLowerCase() === 'student' || viewedUser.role.toLowerCase() === 'professor') && (
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              setShowViewUserModal(false);
                              openTimetableModal(viewedUser);
                            }}
                            disabled={actionInProgress}
                          >
                            View Timetable
                          </button>
                        )}
                        
                        <button 
                          className="btn-danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this user?')) {
                              deleteUser(viewedUser.id);
                              setShowViewUserModal(false);
                            }
                          }}
                          disabled={actionInProgress}
                        >
                          Delete User
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setShowViewUserModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal show">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Add New User</h2>
              <span 
                className="close-modal"
                onClick={() => !actionInProgress && setShowAddUserModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <form onSubmit={addUser}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      name="firstName"
                      value={newUser.firstName}
                      onChange={handleNewUserChange}
                      required 
                      disabled={actionInProgress}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      name="lastName"
                      value={newUser.lastName}
                      onChange={handleNewUserChange}
                      required 
                      disabled={actionInProgress}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    required 
                    disabled={actionInProgress}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input 
                    type="password" 
                    id="password" 
                    name="password"
                    value={newUser.password}
                    onChange={handleNewUserChange}
                    required 
                    disabled={actionInProgress}
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select 
                      id="role" 
                      name="role"
                      value={newUser.role}
                      onChange={handleNewUserChange}
                      required
                      disabled={actionInProgress}
                    >
                      <option value="professor">Professor</option>
                      <option value="student">Student</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select 
                      id="status" 
                      name="status"
                      value={newUser.status}
                      onChange={handleNewUserChange}
                      required
                      disabled={actionInProgress}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                
                {/* Information about timetable management */}
                {(newUser.role === 'student' || newUser.role === 'professor') && (
                  <div className="info-box">
                    <h4>Timetable Management</h4>
                    <p>
                      Timetables for {newUser.role === 'student' ? 'students' : 'professors'} are managed through
                      Class Groups. Once this user is created, assign them to class groups to automatically
                      populate their timetable.
                    </p>
                    <ul>
                      <li>For students: Add them to their enrolled class groups</li>
                      <li>For professors: Assign them as instructors to class groups</li>
                    </ul>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={actionInProgress}
                >
                  {actionInProgress ? 'Adding...' : 'Add User'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Timetable View Modal */}
      {showTimetableModal && selectedUser && (
        <div className="modal show">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2>Timetable: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.role})</h2>
              <span 
                className="close-modal"
                onClick={() => !actionInProgress && setShowTimetableModal(false)}
              >
                &times;
              </span>
            </div>
            <div className="modal-body">
              <div className="timetable-section">
                <div className="info-box info-warning">
                  <h4>Timetable Management Notice</h4>
                  <p>
                    Timetables for {selectedUser.role.toLowerCase()} are managed through class groups.
                    To modify this timetable, please use the Class Groups management section to:
                  </p>
                  <ul>
                    {selectedUser.role.toLowerCase() === 'student' ? (
                      <li>Add or remove the student from class groups</li>
                    ) : (
                      <li>Assign the professor to class groups as an instructor</li>
                    )}
                    <li>Update the timetable entries for each class group</li>
                  </ul>
                </div>
                
                {/* Show timetable loading or error state */}
                {timetableLoading ? (
                  <div className="timetable-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading timetable data...</p>
                  </div>
                ) : timetableError ? (
                  <div className="timetable-error">
                    <span>{timetableError}</span>
                    <button 
                      className="retry-button"
                      onClick={retryLoadTimetable}
                      disabled={timetableLoading}
                    >
                      <i className="fas fa-sync-alt"></i> Retry
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Display timetable entries */}
                    <div className="timetable-entries">
                      <h4>Current Timetable</h4>
                      {(selectedUser.timetableEntries?.length || 0) === 0 ? (
                        <p>No courses in timetable yet. Assign this user to class groups to populate their timetable.</p>
                      ) : (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Day</th>
                              <th>Course</th>
                              <th>Time</th>
                              <th>Location</th>
                              <th>Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedUser.timetableEntries.map((entry, index) => (
                              <tr key={index} style={{ borderLeft: `4px solid ${entry.color || '#6366f1'}` }}>
                                <td>{entry.day}</td>
                                <td>{entry.name}</td>
                                <td>{entry.startTime} - {entry.endTime}</td>
                                <td>{entry.location || 'Not specified'}</td>
                                <td>{entry.type || 'Not specified'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowTimetableModal(false)}
                  disabled={actionInProgress}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;