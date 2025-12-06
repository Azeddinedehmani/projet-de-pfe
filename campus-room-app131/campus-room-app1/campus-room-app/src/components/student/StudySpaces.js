import React, { useState, useEffect } from 'react';
import { useReservationSettings } from '../../hooks/useSettings';
import Modal from '../common/Modal';
import '../../styles/unifié.css';

const StudySpaces = () => {
  // Use the settings hook for real-time settings
  const { settings: reservationSettings, loading: settingsLoading, error: settingsError } = useReservationSettings();
  
  // State for study rooms
  const [studyRooms] = useState([
    {
      id: 1,
      name: 'Study Room A',
      capacity: 4,
      type: 'Group Study',
      amenities: ['Whiteboard', 'Projector', 'Wi-Fi'],
      available: true,
      location: 'Library - Floor 2'
    },
    {
      id: 2,
      name: 'Study Room B',
      capacity: 2,
      type: 'Individual Study',
      amenities: ['Desk Lamp', 'Wi-Fi', 'Power Outlets'],
      available: true,
      location: 'Library - Floor 1'
    },
    {
      id: 3,
      name: 'Study Room C',
      capacity: 6,
      type: 'Group Study',
      amenities: ['Whiteboard', 'TV Screen', 'Wi-Fi'],
      available: false,
      location: 'Library - Floor 3'
    }
  ]);
  
  // Filter states
  const [filters, setFilters] = useState({
    location: '',
    type: '',
    capacity: ''
  });
  
  // Filtered rooms based on current filters
  const [filteredRooms, setFilteredRooms] = useState(studyRooms);
  
  // Reservation modal states
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reservationForm, setReservationForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    numberOfPeople: '',
    notes: ''
  });
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState([]);

  // Apply filters whenever filters change
  useEffect(() => {
    let filtered = studyRooms;
    
    if (filters.location) {
      filtered = filtered.filter(room => 
        room.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(room => room.type === filters.type);
    }
    
    if (filters.capacity) {
      filtered = filtered.filter(room => room.capacity >= parseInt(filters.capacity));
    }
    
    setFilteredRooms(filtered);
  }, [filters, studyRooms]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      location: '',
      type: '',
      capacity: ''
    });
    setFilteredRooms(studyRooms);
  };

  // Open reservation modal
  const openReservationModal = (room) => {
    setSelectedRoom(room);
    setReservationForm({
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      numberOfPeople: '',
      notes: ''
    });
    setValidationErrors([]);
    setShowReserveModal(true);
  };

  // Handle reservation form input
  const handleReservationChange = (e) => {
    const { name, value } = e.target;
    setReservationForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  // Validate reservation form against current settings
  const validateReservationForm = () => {
    if (!reservationSettings) {
      return { isValid: false, errors: ['Settings not loaded. Please try again.'] };
    }

    const errors = [];
    const { date, startTime, endTime, purpose, numberOfPeople } = reservationForm;

    // Basic required field validation
    if (!date) errors.push('Date is required');
    if (!startTime) errors.push('Start time is required');
    if (!endTime) errors.push('End time is required');
    if (!purpose) errors.push('Purpose is required');
    if (!numberOfPeople) errors.push('Number of people is required');

    // If basic validation fails, return early
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const daysInAdvance = Math.ceil((reservationDate - today) / (1000 * 60 * 60 * 24));

    // Check if date is in the past
    if (reservationDate < today) {
      errors.push('Cannot make reservations for past dates');
    }

    // Check max days in advance
    if (daysInAdvance > reservationSettings.maxDaysInAdvance) {
      errors.push(`Reservations can only be made up to ${reservationSettings.maxDaysInAdvance} days in advance`);
    }

    // Check minimum time before reservation (only for today)
    if (daysInAdvance === 0) {
      const now = new Date();
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const requestStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMinutes);
      const hoursBeforeStart = (requestStart - now) / (1000 * 60 * 60);
      
      if (hoursBeforeStart < reservationSettings.minTimeBeforeReservation) {
        errors.push(`Reservations must be made at least ${reservationSettings.minTimeBeforeReservation} hour(s) in advance`);
      }
    }

    // Check max hours per reservation
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startDecimal = startHours + startMinutes / 60;
    const endDecimal = endHours + endMinutes / 60;
    
    if (endDecimal <= startDecimal) {
      errors.push('End time must be after start time');
    } else {
      const durationHours = endDecimal - startDecimal;
      if (durationHours > reservationSettings.maxHoursPerReservation) {
        errors.push(`Reservations cannot exceed ${reservationSettings.maxHoursPerReservation} hours`);
      }
    }

    // Check room capacity
    const peopleCount = parseInt(numberOfPeople);
    if (peopleCount > selectedRoom.capacity) {
      errors.push(`Number of people (${peopleCount}) exceeds room capacity (${selectedRoom.capacity})`);
    }

    return { isValid: errors.length === 0, errors };
  };

  // Submit reservation with validation
  const submitReservation = (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateReservationForm();
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Clear any previous validation errors
    setValidationErrors([]);

    // Determine status based on settings
    const status = reservationSettings.studentRequireApproval ? 'Pending' : 'Approved';
    
    // Create reservation object
    const newReservation = {
      id: `SR${Date.now()}`,
      room: selectedRoom.name,
      date: reservationForm.date,
      time: `${reservationForm.startTime} - ${reservationForm.endTime}`,
      purpose: reservationForm.purpose,
      numberOfPeople: reservationForm.numberOfPeople,
      notes: reservationForm.notes,
      status: status,
      userId: 'current-user-email', // This should come from your auth context
      userRole: 'student',
      createdAt: new Date().toISOString()
    };
    
    // Save to localStorage (in real app, this would be an API call)
    const studentReservations = JSON.parse(localStorage.getItem('studentReservations') || '[]');
    studentReservations.push(newReservation);
    localStorage.setItem('studentReservations', JSON.stringify(studentReservations));
    
    // Close modal and show confirmation
    setShowReserveModal(false);
    
    const approvalMessage = status === 'Approved' 
      ? 'Your reservation has been automatically approved!' 
      : 'Your reservation request has been submitted and is pending approval.';
    
    alert(`Reservation request submitted for ${selectedRoom.name} on ${reservationForm.date} at ${reservationForm.startTime} - ${reservationForm.endTime}.\n\n${approvalMessage}`);
  };

  // Show loading state while settings are loading
  if (settingsLoading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading study spaces and settings...</p>
        </div>
      </div>
    );
  }

  // Show error if settings failed to load
  if (settingsError) {
    return (
      <div className="main-content">
        <div className="error-container">
          <h3>Error Loading Settings</h3>
          <p>{settingsError}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="section-header">
        <h2>Study Spaces</h2>
        <p>Reserve quiet study rooms and collaborative spaces</p>
      </div>

      {/* Settings Info Banner */}
      {reservationSettings && (
        <div className="settings-info-banner" style={{ 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: '8px', 
          padding: '12px', 
          marginBottom: '20px',
          fontSize: '0.9em'
        }}>
          <strong>Current Reservation Limits:</strong> 
          Max {reservationSettings.maxDaysInAdvance} days advance • 
          Max {reservationSettings.maxHoursPerReservation} hours per booking • 
          {reservationSettings.studentRequireApproval ? ' Requires approval' : ' Auto-approved'}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="Filter by location..."
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="Individual Study">Individual Study</option>
              <option value="Group Study">Group Study</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="capacity">Min Capacity</label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              placeholder="Min people..."
              min="1"
              value={filters.capacity}
              onChange={handleFilterChange}
            />
          </div>
          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Study Rooms Grid */}
      <div className="rooms-grid">
        {filteredRooms.map(room => (
          <div key={room.id} className={`room-card ${!room.available ? 'unavailable' : ''}`}>
            <div className="room-header">
              <h3>{room.name}</h3>
              <span className={`status-badge ${room.available ? 'available' : 'unavailable'}`}>
                {room.available ? 'Available' : 'Occupied'}
              </span>
            </div>
            
            <div className="room-details">
              <p><strong>Type:</strong> {room.type}</p>
              <p><strong>Capacity:</strong> {room.capacity} people</p>
              <p><strong>Location:</strong> {room.location}</p>
              
              <div className="amenities">
                <strong>Amenities:</strong>
                <div className="amenities-list">
                  {room.amenities.map(amenity => (
                    <span key={amenity} className="amenity-tag">{amenity}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="room-actions">
              <button 
                className="btn-primary"
                onClick={() => openReservationModal(room)}
                disabled={!room.available}
              >
                {room.available ? 'Reserve' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="no-results">
          <p>No study spaces match your filters. Try adjusting your search criteria.</p>
        </div>
      )}

      {/* Reservation Modal */}
      <Modal 
        show={showReserveModal} 
        onClose={() => setShowReserveModal(false)}
        title={`Reserve ${selectedRoom?.name}`}
      >
        {validationErrors.length > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
            <strong>Please fix the following errors:</strong>
            <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={submitReservation}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input 
                type="date" 
                id="date" 
                name="date"
                value={reservationForm.date}
                onChange={handleReservationChange}
                min={new Date().toISOString().split('T')[0]}
                max={reservationSettings ? 
                  new Date(Date.now() + reservationSettings.maxDaysInAdvance * 24 * 60 * 60 * 1000)
                    .toISOString().split('T')[0] : undefined}
                required 
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input 
                type="time" 
                id="startTime" 
                name="startTime"
                value={reservationForm.startTime}
                onChange={handleReservationChange}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input 
                type="time" 
                id="endTime" 
                name="endTime"
                value={reservationForm.endTime}
                onChange={handleReservationChange}
                required 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="purpose">Purpose</label>
            <select 
              id="purpose" 
              name="purpose"
              value={reservationForm.purpose}
              onChange={handleReservationChange}
              required
            >
              <option value="">Select Purpose</option>
              <option value="Individual Study">Individual Study</option>
              <option value="Group Study">Group Study</option>
              <option value="Project Work">Project Work</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="numberOfPeople">Number of People</label>
            <input 
              type="number" 
              id="numberOfPeople" 
              name="numberOfPeople"
              min="1"
              max={selectedRoom?.capacity}
              value={reservationForm.numberOfPeople}
              onChange={handleReservationChange}
              required 
            />
            <small>Maximum capacity: {selectedRoom?.capacity} people</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Additional Notes (Optional)</label>
            <textarea 
              id="notes" 
              name="notes"
              rows="3"
              placeholder="Any special requirements or notes..."
              value={reservationForm.notes}
              onChange={handleReservationChange}
            ></textarea>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Submit Reservation
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => setShowReserveModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StudySpaces;