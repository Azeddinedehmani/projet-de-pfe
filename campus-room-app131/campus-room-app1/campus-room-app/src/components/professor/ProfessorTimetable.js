import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { API } from '../../api';
import '../../styles/unifié.css';

const ProfessorTimetable = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Time slots
  const timeSlots = [
    '8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00',
    '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00',
    '16:00 - 17:00', '17:00 - 18:00'
  ];
  
  // Days of the week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Update the useEffect hook that fetches timetable data
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First check if user is authenticated
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        console.log('Fetching timetable data from API for professor:', currentUser.email);
        
        // Make API call to get the timetable data
        // Primary endpoint - try first
        let response;
        
        try {
          // Try professor-specific endpoint first
          response = await API.get('/api/professor/timetable');
          console.log('Professor timetable endpoint response:', response);
        } catch (err) {
          console.log('Professor timetable endpoint failed, trying general endpoint');
          // Fall back to general timetable endpoint
          response = await API.timetableAPI.getMyTimetable();
          console.log('General timetable API response:', response);
        }
        
        if (response && response.data) {
          // Process the timetable entries
          const processedData = processTimetableData(response.data);
          setTimetableData(processedData);
          console.log('Timetable data processed successfully');
        } else {
          throw new Error('No data received from timetable API');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        
        // Provide specific error message to help debug the issue
        if (err.response) {
          // Server responded with an error status
          if (err.response.status === 401) {
            setError('Authentication error. Please log in again.');
            // Redirect to login page or handle auth error
            navigate('/');
          } else {
            setError(`Server error: ${err.response.status} - ${err.response.data?.message || 'Unknown error'}`);
          }
        } else if (err.request) {
          // Request was made but no response received
          setError('No response from server. Please check your connection.');
        } else {
          // Something else went wrong
          setError(`Error: ${err.message}`);
        }
        
        setLoading(false);
        
        // Only use mock data in development environment
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock data as fallback during development');
          setTimetableData(getMockTimetableData());
        }
      }
    };
    
    fetchTimetable();
  }, [currentUser, navigate]);

// Updated processTimetableData function
const processTimetableData = (timetableEntries) => {
  const processedData = {};
  
  // Initialize empty arrays for each day
  daysOfWeek.forEach(day => {
    processedData[day] = [];
  });
  
  // Check if timetableEntries is an array
  if (Array.isArray(timetableEntries)) {
    console.log(`Processing ${timetableEntries.length} timetable entries`);
    
    // Process each entry
    timetableEntries.forEach(entry => {
      const day = entry.day;
      
      if (daysOfWeek.includes(day)) {
        // Ensure both startTime and endTime have a consistent format (HH:MM)
        const startTime = formatTimeString(entry.startTime);
        const endTime = formatTimeString(entry.endTime);
        
        processedData[day].push({
          id: entry.id,
          name: entry.name || 'Unnamed Course',
          instructor: entry.instructor || 'No instructor assigned',
          location: entry.location || 'TBD',
          startTime: startTime,
          endTime: endTime,
          color: entry.color || '#6366f1',
          type: entry.type || 'Lecture',
          description: entry.description || ''
        });
      }
    });
  }
  
  return processedData;
};

  // Helper function to ensure consistent time format (HH:MM)
  const formatTimeString = (timeString) => {
    if (!timeString) return '00:00';
    
    // Handle different time formats that might come from the API
    if (typeof timeString === 'string') {
      // If in format HH:MM, return as is
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString.padStart(5, '0'); // Ensure HH:MM (e.g., "9:00" -> "09:00")
      }
      
      // If in format HH:MM:SS, remove seconds
      if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
        return timeString.split(':').slice(0, 2).join(':').padStart(5, '0');
      }
      
      // Try to parse time from string (in case of ISO format or other)
      try {
        const date = new Date(timeString);
        if (!isNaN(date)) {
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
      } catch (e) {
        console.warn('Could not parse time from string:', timeString);
      }
    }
    
    // If all else fails, try to convert to string and take first 5 chars
    return String(timeString).padStart(5, '0');
  };
  
  // Fallback mock data in case the API fails
  const getMockTimetableData = () => {
    return {
      'Monday': [
        { id: 'P1', name: 'CS 101: Intro to Programming', instructor: 'TA Williams', location: 'Room 101', startTime: '9:00', endTime: '10:30', color: '#6366f1', type: 'Lecture' },
        { id: 'P2', name: 'CS 301: Data Structures', instructor: 'TA Johnson', location: 'Room 204', startTime: '13:00', endTime: '14:30', color: '#10b981', type: 'Lecture' }
      ],
      'Tuesday': [
        { id: 'P3', name: 'CS 201: Computer Architecture', instructor: 'TA Smith', location: 'Lab 305', startTime: '11:00', endTime: '12:30', color: '#0ea5e9', type: 'Lab' }
      ],
      'Wednesday': [
        { id: 'P4', name: 'CS 101: Intro to Programming', instructor: 'TA Williams', location: 'Room 101', startTime: '9:00', endTime: '10:30', color: '#6366f1', type: 'Lecture' },
        { id: 'P5', name: 'Faculty Meeting', instructor: null, location: 'Conference Room', startTime: '15:30', endTime: '16:30', color: '#f59e0b', type: 'Meeting' }
      ],
      'Thursday': [
        { id: 'P6', name: 'Office Hours', instructor: null, location: 'Office 205', startTime: '10:00', endTime: '12:00', color: '#8b5cf6', type: 'Office Hours' },
        { id: 'P7', name: 'CS 201: Computer Architecture', instructor: 'TA Smith', location: 'Lab 305', startTime: '14:00', endTime: '15:30', color: '#0ea5e9', type: 'Lab' }
      ],
      'Friday': [
        { id: 'P8', name: 'CS 301: Data Structures', instructor: 'TA Johnson', location: 'Room 204', startTime: '13:00', endTime: '14:30', color: '#10b981', type: 'Lecture' },
        { id: 'P9', name: 'Research Group Meeting', instructor: null, location: 'Lab 310', startTime: '16:00', endTime: '17:00', color: '#ec4899', type: 'Meeting' }
      ]
    };
  };
  
  // Current day
  const getCurrentDay = () => {
    const date = new Date();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    return daysOfWeek.includes(day) ? day : 'Monday';
  };
  
  // Course search filter
  const filteredCourses = () => {
    if (!searchTerm) return [];
    
    const results = [];
    daysOfWeek.forEach(day => {
      if (timetableData[day]) {
        timetableData[day].forEach(course => {
          if (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (course.instructor && course.instructor.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (course.location && course.location.toLowerCase().includes(searchTerm.toLowerCase()))) {
            results.push({...course, day});
          }
        });
      }
    });
    
    return results;
  };
  
  // Time to row index mapping
  const getRowIndex = (time) => {
    const hour = parseInt(time.split(':')[0]);
    return hour - 8; // 8:00 is the first slot (index 0)
  };
  
  // View course details
  const viewCourse = (course, day) => {
    setSelectedCourse({...course, day});
    setShowCourseModal(true);
  };
  
  // Get upcoming classes
  const getUpcomingClasses = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = getCurrentDay();
    
    let upcoming = [];
    
    // Get all courses for today that haven't started yet
    if (timetableData[currentDay]) {
      upcoming = timetableData[currentDay].filter(course => {
        const startHour = parseInt(course.startTime.split(':')[0]);
        return startHour > currentHour;
      });
    }
    
    // If less than 3 upcoming courses today, get courses for tomorrow
    if (upcoming.length < 3) {
      const tomorrow = daysOfWeek[(daysOfWeek.indexOf(currentDay) + 1) % 5];
      if (timetableData[tomorrow]) {
        const tomorrowCourses = timetableData[tomorrow].map(course => ({
          ...course,
          day: tomorrow
        }));
        upcoming = [...upcoming, ...tomorrowCourses].slice(0, 3);
      }
    }
    
    return upcoming;
  };
  
  // Calculate week dates
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday as first day
    
    startOfWeek.setDate(today.getDate() - diff + (currentWeek * 7));
    
    return daysOfWeek.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  };
  
  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Week dates
  const weekDates = getWeekDates();
  
  // Function to export schedule as PDF
  const exportSchedulePDF = async () => {
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Please allow popups to download the PDF');
        return;
      }

      // Generate HTML content for PDF
      const htmlContent = generatePDFContent();
      
      // Write HTML to the new window
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Generate HTML content for PDF - COMPLETELY REDESIGNED FOR SINGLE PAGE
  const generatePDFContent = () => {
    const weekDatesForPDF = getWeekDates();
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // College logo as base64 (you can replace this with your actual logo)
    const collegeLogo = `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="40" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="#1e40af" stroke="#fff" stroke-width="2"/>
        <text x="50" y="35" text-anchor="middle" fill="white" font-family="serif" font-size="20" font-weight="bold">EDU</text>
        <text x="50" y="55" text-anchor="middle" fill="white" font-family="serif" font-size="12">COLLEGE</text>
        <path d="M20 65 L50 75 L80 65" stroke="white" stroke-width="2" fill="none"/>
      </svg>
    `)}`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Professor Timetable - ${currentDate}</title>
        <style>
            @page {
                size: A4 landscape;
                margin: 0.2in;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                color: #333;
                background: white;
                line-height: 1.2;
                font-size: 12px;
                page-break-inside: avoid;
            }
            
            .pdf-container {
                width: 100%;
                height: 100vh;
                display: flex;
                flex-direction: column;
                page-break-inside: avoid;
            }
            
            .pdf-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 2px solid #1e40af;
                flex-shrink: 0;
            }
            
            .college-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .college-logo {
                width: 35px;
                height: 35px;
            }
            
            .college-details h1 {
                color: #1e40af;
                font-size: 16px;
                margin-bottom: 1px;
            }
            
            .college-details p {
                color: #666;
                font-size: 9px;
                line-height: 1.1;
            }
            
            .document-info {
                text-align: right;
            }
            
            .document-info h2 {
                color: #1e40af;
                font-size: 14px;
                margin-bottom: 2px;
            }
            
            .document-info p {
                color: #666;
                font-size: 8px;
                line-height: 1.1;
            }
            
            .professor-info {
                background: #f8fafc;
                padding: 4px 8px;
                border-radius: 4px;
                margin-bottom: 6px;
                border-left: 3px solid #1e40af;
                flex-shrink: 0;
            }
            
            .professor-info h3 {
                color: #1e40af;
                margin-bottom: 1px;
                font-size: 11px;
            }
            
            .professor-info p {
                font-size: 8px;
            }
            
            .week-info {
                text-align: center;
                margin-bottom: 8px;
                padding: 4px;
                background: #e0f2fe;
                border-radius: 4px;
                flex-shrink: 0;
            }
            
            .week-info h3 {
                color: #0369a1;
                margin-bottom: 2px;
                font-size: 11px;
            }
            
            .week-info p {
                font-size: 8px;
            }
            
            .timetable-container {
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            
            .timetable-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 9px;
                height: 100%;
                table-layout: fixed;
            }
            
            .timetable-table th {
                background: #1e40af;
                color: white;
                padding: 3px 2px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #1e3a8a;
                font-size: 9px;
                height: 35px;
            }
            
            .timetable-table td {
                padding: 1px;
                border: 1px solid #d1d5db;
                text-align: center;
                vertical-align: middle;
                height: 25px;
                position: relative;
                font-size: 8px;
            }
            
            .time-slot {
                background: #f1f5f9;
                font-weight: bold;
                color: #475569;
                width: 60px;
                font-size: 8px;
                padding: 2px 1px;
            }
            
            .course-block {
                background: var(--course-color, #6366f1);
                color: white;
                padding: 4px 6px;
                border-radius: 3px;
                margin: 1px;
                font-size: 8px;
                text-align: center;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                box-sizing: border-box;
                min-height: 20px;
            }
            
            .course-name {
                font-weight: bold;
                margin-bottom: 2px;
                font-size: 9px;
                line-height: 1.1;
                text-align: center;
            }
            
            .course-details {
                font-size: 7px;
                opacity: 0.9;
                line-height: 1.0;
                text-align: center;
            }
            
            .empty-slot {
                background: #f9fafb;
                color: #9ca3af;
                font-style: italic;
                font-size: 7px;
            }

            .course-cell {
                padding: 2px;
                border: 1px solid #d1d5db;
                text-align: center;
                vertical-align: middle;
                position: relative;
                background: white;
            }
            
            .footer {
                margin-top: 4px;
                padding-top: 3px;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 6px;
                color: #666;
                flex-shrink: 0;
            }
            
            .footer-left {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .generated-info {
                text-align: right;
                font-size: 6px;
            }
            
            /* Ensure no page breaks */
            .pdf-container, .timetable-container, .timetable-table {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        </style>
    </head>
    <body>
        <div class="pdf-container">
            <div class="pdf-header">
                <div class="college-info">
                    <img src="${collegeLogo}" alt="College Logo" class="college-logo">
                    <div class="college-details">
                        <h1>University College</h1>
                        <p>Department of Computer Science</p>
                        <p>Academic Timetable System</p>
                    </div>
                </div>
                <div class="document-info">
                    <h2>Professor Timetable</h2>
                    <p>Generated: ${currentDate}</p>
                    <p>Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</p>
                </div>
            </div>

            <div class="professor-info">
                <h3>Prof: ${currentUser?.displayName || currentUser?.email || 'Unknown Professor'}</h3>
                <p>Email: ${currentUser?.email || 'N/A'} | Dept: Computer Science</p>
            </div>

            <div class="week-info">
                <h3>Week: ${formatDate(weekDatesForPDF[0])} - ${formatDate(weekDatesForPDF[4])}</h3>
                <p>${currentWeek === 0 ? 'Current Week' : (currentWeek > 0 ? `${currentWeek} Week${currentWeek !== 1 ? 's' : ''} Ahead` : `${Math.abs(currentWeek)} Week${Math.abs(currentWeek) !== 1 ? 's' : ''} Ago`)}</p>
            </div>

            <div class="timetable-container">
                <table class="timetable-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            ${daysOfWeek.map((day, index) => 
                              `<th>${day}<br><small>${formatDate(weekDatesForPDF[index])}</small></th>`
                            ).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${timeSlots.map((slot, slotIndex) => {
                          const slotStartHour = parseInt(slot.split(':')[0]);
                          return `
                            <tr>
                                <td class="time-slot">${slot.split(' - ')[0]}</td>
                                ${daysOfWeek.map(day => {
                                  // Check if this cell should be skipped (part of a rowspan from previous row)
                                  const isPartOfRowspan = timetableData[day]?.some(course => {
                                    const courseStartHour = parseInt(course.startTime.split(':')[0]);
                                    const courseEndHour = parseInt(course.endTime.split(':')[0]);
                                    const courseEndMin = parseInt(course.endTime.split(':')[1] || 0);
                                    
                                    // Calculate end hour considering minutes
                                    const actualEndHour = courseEndMin > 0 ? courseEndHour + 1 : courseEndHour;
                                    
                                    // This slot is part of a rowspan if course started before this hour and ends after
                                    return courseStartHour < slotStartHour && actualEndHour > slotStartHour;
                                  });
                                  
                                  if (isPartOfRowspan) {
                                    return ''; // Skip this cell - it's part of a rowspan
                                  }
                                  
                                  // Find courses that start in this time slot
                                  const coursesInSlot = timetableData[day]?.filter(course => {
                                    const courseStartHour = parseInt(course.startTime.split(':')[0]);
                                    return courseStartHour === slotStartHour;
                                  }) || [];
                                  
                                  if (coursesInSlot.length === 0) {
                                    return '<td class="empty-slot">-</td>';
                                  }
                                  
                                  return coursesInSlot.map(course => {
                                    // Calculate rowspan for multi-hour courses
                                    const courseStartHour = parseInt(course.startTime.split(':')[0]);
                                    const courseEndHour = parseInt(course.endTime.split(':')[0]);
                                    const courseEndMin = parseInt(course.endTime.split(':')[1] || 0);
                                    
                                    // Calculate how many hour slots this course spans
                                    let rowspan = courseEndHour - courseStartHour;
                                    if (courseEndMin > 0) rowspan += 1;
                                    
                                    const rowspanAttr = rowspan > 1 ? `rowspan="${rowspan}"` : '';
                                    
                                    return `<td class="course-cell" ${rowspanAttr}>
                                      <div class="course-block" style="--course-color: ${course.color};">
                                        <div class="course-name">${course.name}</div>
                                        <div class="course-details">
                                          ${course.startTime}-${course.endTime}<br/>${course.location}
                                        </div>
                                      </div>
                                    </td>`;
                                  }).join('');
                                }).join('')}
                            </tr>
                          `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div class="footer">
                <div class="footer-left">
                    <img src="${collegeLogo}" alt="Logo" style="width: 15px; height: 15px; opacity: 0.7;">
                    <span>University College - Official Document</span>
                </div>
                <div class="generated-info">
                    <div>Generated by Campus Timetable System | ID: TT-${Date.now()}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  };
  
 
  // Show loading state
  if (loading) {
    return (
      <div className="timetable-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your timetable...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="timetable-page">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="timetable-page">
      <div className="timetable-header">
        <div className="timetable-title">
          <h1>Professor Timetable</h1>
          <p>Your weekly teaching schedule</p>
        </div>
        
        <div className="timetable-actions">
          <div className="view-toggles">
            <button 
              className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('grid')}
            >
              <i className="fas fa-th"></i> Grid View
            </button>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="fas fa-list"></i> List View
            </button>
          </div>
          
          <div className="export-buttons">
           
            
            <button className="btn btn-success" onClick={exportSchedulePDF}>
              <i className="fas fa-file-pdf"></i> Download PDF
            </button>
          </div>
        </div>
      </div>
      
      <div className="timetable-controls">
        <div className="week-navigation">
          <button 
            className="btn btn-icon" 
            onClick={() => setCurrentWeek(currentWeek - 1)}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="current-week">
            <span className="week-label">{currentWeek === 0 ? 'Current Week' : (currentWeek > 0 ? `${currentWeek} Week${currentWeek !== 1 ? 's' : ''} Ahead` : `${Math.abs(currentWeek)} Week${Math.abs(currentWeek) !== 1 ? 's' : ''} Ago`)}</span>
            <span className="week-dates">{formatDate(weekDates[0])} - {formatDate(weekDates[4])}</span>
          </div>
          
          <button 
            className="btn btn-icon"
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          
          {currentWeek !== 0 && (
            <button 
              className="btn btn-secondary btn-today"
              onClick={() => setCurrentWeek(0)}
            >
              Today
            </button>
          )}
        </div>
        
        <div className="search-container">
          <i className="fas fa-search search-icon"></i>
          <input 
            type="text"
            placeholder="Search courses, assistants, or locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="search-clear"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
      
      {searchTerm && (
        <div className="search-results">
          <h3>Search Results</h3>
          {filteredCourses().length === 0 ? (
            <p className="no-results">No courses matching "{searchTerm}"</p>
          ) : (
            <ul className="course-list">
              {filteredCourses().map((course) => (
                <li 
                  key={`${course.id}-${course.day}`}
                  className="course-item"
                  onClick={() => viewCourse(course, course.day)}
                >
                  <div className="course-color" style={{ backgroundColor: course.color }}></div>
                  <div className="course-info">
                    <h4>{course.name}</h4>
                    <p>{course.day}, {course.startTime} - {course.endTime} | {course.location}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {viewMode === 'grid' ? (
        // Grid View
        <div className="timetable-grid">
          <div className="timetable-grid-header">
            <div className="timetable-grid-times">
              <div className="timetable-grid-time-label"></div>
              {timeSlots.map((slot) => (
                <div key={slot} className="timetable-grid-time">
                  {slot.split(' - ')[0]}
                </div>
              ))}
            </div>
            
            {daysOfWeek.map((day, index) => (
              <div key={day} className={`timetable-grid-day ${day === getCurrentDay() && currentWeek === 0 ? 'current-day' : ''}`}>
                <div className="timetable-day-header">
                  <span className="day-name">{day}</span>
                  <span className="day-date">{formatDate(weekDates[index])}</span>
                </div>
                <div className="timetable-grid-slots">
                  {timeSlots.map((slot) => {
                    const slotStartHour = parseInt(slot.split(':')[0]);
                    
                    // Get courses that occur during this time slot
                    const coursesInSlot = timetableData[day]?.filter(course => {
                      const courseStartHour = parseInt(course.startTime.split(':')[0]);
                      const courseStartMin = parseInt(course.startTime.split(':')[1] || 0);
                      const courseEndHour = parseInt(course.endTime.split(':')[0]);
                      const courseEndMin = parseInt(course.endTime.split(':')[1] || 0);
                      
                      // A course is in this slot if:
                      // 1. It starts during this hour, OR
                      // 2. It started before and ends after this hour
                      return (courseStartHour === slotStartHour) || 
                             (courseStartHour < slotStartHour && courseEndHour > slotStartHour);
                    });
                    
                    return (
                      <div key={`${day}-${slot}`} className="timetable-grid-slot">
                        {coursesInSlot && coursesInSlot.map((course) => {
                          const startHour = parseInt(course.startTime.split(':')[0]);
                          const startMin = parseInt(course.startTime.split(':')[1] || 0);
                          
                          // Only render if this is the starting slot for this course
                          if (startHour === slotStartHour) {
                            const endHour = parseInt(course.endTime.split(':')[0]);
                            const endMin = parseInt(course.endTime.split(':')[1] || 0);
                            
                            // Calculate duration in hours (including partial hours)
                            const durationHours = (endHour + endMin/60) - (startHour + startMin/60);
                            
                            return (
                              <div 
                                key={course.id}
                                className="timetable-course"
                                style={{ 
                                  backgroundColor: course.color,
                                  height: `${durationHours * 100}%`,
                                  top: `${(startMin/60) * 100}%`,
                                  opacity: 0.9
                                }}
                                onClick={() => viewCourse(course, day)}
                              >
                               <h4 className="course-name">{course.name}</h4>
                                <p className="course-time">{course.startTime} - {course.endTime}</p>
                                <p className="course-location">{course.location}</p>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // List View
        <div className="timetable-list">
          {daysOfWeek.map((day, index) => (
            <div key={day} className="timetable-list-day">
              <div className={`timetable-list-day-header ${day === getCurrentDay() && currentWeek === 0 ? 'current-day' : ''}`}>
                <h3>{day}</h3>
                <span className="day-date">{formatDate(weekDates[index])}</span>
              </div>
              
              {timetableData[day] && timetableData[day].length > 0 ? (
                <div className="timetable-list-courses">
                  {timetableData[day].map((course) => (
                    <div 
                      key={course.id}
                      className="timetable-list-course"
                      onClick={() => viewCourse(course, day)}
                    >
                      <div className="course-time-block">
                        <span className="course-time-start">{course.startTime}</span>
                        <span className="course-time-separator"></span>
                        <span className="course-time-end">{course.endTime}</span>
                      </div>
                      
                      <div className="course-content" style={{ borderLeftColor: course.color }}>
                        <h4 className="course-name">{course.name}</h4>
                        <div className="course-details">
                          <span className="course-type">{course.type}</span>
                          <span className="course-location">
                            <i className="fas fa-map-marker-alt"></i> {course.location}
                          </span>
                          {course.instructor && (
                            <span className="course-instructor">
                              <i className="fas fa-user"></i> {course.instructor}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="course-actions">
                        <button className="btn-icon" title="Course materials">
                          <i className="fas fa-book"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-courses">
                  <p>No classes scheduled for this day</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="upcoming-section">
        <h3>Upcoming Classes</h3>
        <div className="upcoming-classes">
          {getUpcomingClasses().length > 0 ? (
            getUpcomingClasses().map((course, index) => (
              <div 
                key={`upcoming-${course.id}-${index}`}
                className="upcoming-class"
                style={{ borderLeftColor: course.color }}
              >
                <div className="upcoming-class-day">{course.day}</div>
                <div className="upcoming-class-time">{course.startTime} - {course.endTime}</div>
                <div className="upcoming-class-name">{course.name}</div>
                <div className="upcoming-class-location">{course.location}</div>
              </div>
            ))
          ) : (
            <p className="no-upcoming">No upcoming classes today or tomorrow</p>
          )}
        </div>
      </div>
      
      {/* Course Modal - Read-only view like student version */}
      {showCourseModal && selectedCourse && (
        <div className="course-modal-backdrop" onClick={() => setShowCourseModal(false)}>
          <div className="course-modal" onClick={(e) => e.stopPropagation()}>
            <div className="course-modal-header" style={{ backgroundColor: selectedCourse.color }}>
              <h3>{selectedCourse.name}</h3>
              <button className="modal-close" onClick={() => setShowCourseModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="course-modal-content">
              <div className="course-details-grid">
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-clock"></i> Time
                  </div>
                  <div className="detail-value">
                    {selectedCourse.startTime} - {selectedCourse.endTime}
                  </div>
                </div>
                
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-calendar-day"></i> Day
                  </div>
                  <div className="detail-value">
                    {selectedCourse.day}
                  </div>
                </div>
                
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-map-marker-alt"></i> Location
                  </div>
                  <div className="detail-value">
                    {selectedCourse.location}
                  </div>
                </div>
                
                <div className="course-detail">
                  <div className="detail-label">
                    <i className="fas fa-chalkboard-teacher"></i> Type
                  </div>
                  <div className="detail-value">
                    {selectedCourse.type}
                  </div>
                </div>
                
                {selectedCourse.instructor && (
                  <div className="course-detail">
                    <div className="detail-label">
                      <i className="fas fa-user"></i> Assistant
                    </div>
                    <div className="detail-value">
                      {selectedCourse.instructor}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="course-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorTimetable;