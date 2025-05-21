import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import axios from 'axios'; // Import axios directly for fallback
import PDFReport from './PDFReport';
import { API } from '../../api'; // Import the API object

const AdminReports = () => {
  // State for stats and data
  const [stats, setStats] = useState({
    totalReservations: 0,
    approvedReservations: 0,
    pendingReservations: 0,
    rejectedReservations: 0,
    professorReservations: 0,
    studentReservations: 0,
    totalClassrooms: 0,
    totalStudyRooms: 0,
    totalUsers: 0,
    usersByRole: {
      adminCount: 0,
      professorCount: 0,
      studentCount: 0,
      otherCount: 0
    }
  });
  
  const [popularRooms, setPopularRooms] = useState([]);
  const [mostActiveUsers, setMostActiveUsers] = useState([]);
  const [monthlyActivity, setMonthlyActivity] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  
  // Show PDF Report modal
  const [showPDFReport, setShowPDFReport] = useState(false);
  const [pdfData, setPDFData] = useState(null);
  
  // Log component mount for debugging
  useEffect(() => {
    console.log("AdminReports component mounted");
    fetchReportData();
  }, [refreshTrigger]);
  
  // Fetch report data from API - with fallback methods
  const fetchReportData = async () => {
    try {
      console.log("⚠️ About to fetch report data");
      setLoading(true);
      setError(null);
      
      // Attempt to use the API.reportsAPI object
      if (API && API.reportsAPI && typeof API.reportsAPI.getReportsData === 'function') {
        console.log("Using API.reportsAPI for data fetch");
        const response = await API.reportsAPI.getReportsData(true);
        console.log("✅ Response received:", response);
        
        const reportData = response.data;
        processReportData(reportData);
      } else {
        // Fallback to direct axios call
        console.log("API.reportsAPI not available, using direct axios call");
        const response = await axios.get('http://localhost:8080/api/reports', {
          params: { forceRefresh: true }
        });
        console.log("✅ Response received from direct axios call:", response);
        
        const reportData = response.data;
        processReportData(reportData);
      }
    } catch (error) {
      console.error("❌ Error fetching report data:", error);
      
      // Attempt fallback with direct axios request
      try {
        console.log("Attempting direct axios request as fallback");
        const response = await axios.get('http://localhost:8080/api/reports', {
          params: { forceRefresh: true }
        });
        
        const reportData = response.data;
        processReportData(reportData);
        
        // Clear error since fallback succeeded
        setError(null);
      } catch (fallbackError) {
        console.error("Fallback request also failed:", fallbackError);
        
        // Set a specific error message
        if (error.message && error.message.includes('undefined')) {
          setError("Failed to load report data: API configuration error - " + error.message);
        } else {
          setError("Failed to load report data: " + (error.message || "Unknown error"));
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Process report data from API response
  const processReportData = (reportData) => {
    // Set stats from API response
    if (reportData.statistics) {
      console.log("Setting stats:", reportData.statistics);
      setStats(reportData.statistics);
    }
    
    // Set popular rooms from API response
    if (reportData.popularRooms) {
      console.log("Setting popular rooms:", reportData.popularRooms);
      // Ensure roleData exists with appropriate defaults
      const roomsWithDefaults = reportData.popularRooms.map(room => ({
        ...room,
        percentage: room.percentage || 0,
        roleData: room.roleData || { professor: 0, student: 0, admin: 0, unknown: 0 }
      }));
      setPopularRooms(roomsWithDefaults);
    }
    
    // Set most active users from API response
    if (reportData.activeUsers) {
      console.log("Setting active users:", reportData.activeUsers);
      const usersWithDefaults = reportData.activeUsers.map(user => ({
        ...user,
        userName: user.userName || "Unknown User",
        role: user.role || "Unknown Role",
        count: user.count || 0
      }));
      setMostActiveUsers(usersWithDefaults);
    }
    
    // Set monthly activity from API response
    if (reportData.monthlyActivity) {
      console.log("Setting monthly activity:", reportData.monthlyActivity);
      // Ensure adminCount exists for each month
      const activityWithDefaults = reportData.monthlyActivity.map(month => ({
        ...month,
        professorCount: month.professorCount || 0,
        studentCount: month.studentCount || 0,
        adminCount: month.adminCount !== undefined ? month.adminCount : 0,
        total: month.total || 0
      }));
      setMonthlyActivity(activityWithDefaults);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle regenerate button click
  const handleRegenerate = async () => {
    try {
      setLoading(true);
      
      if (API && API.reportsAPI && typeof API.reportsAPI.regenerateReports === 'function') {
        await API.reportsAPI.regenerateReports();
      } else {
        // Fallback to direct axios call
        await axios.post('http://localhost:8080/api/reports/regenerate');
      }
      
      // Fetch fresh data after regeneration
      await fetchReportData();
    } catch (error) {
      console.error("Error regenerating reports:", error);
      setError("Failed to regenerate reports: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  // Generate CSV report
  const generateCSV = async () => {
    try {
      setExportLoading(true);
      
      // Get CSV data from backend (with fallback)
      let response;
      
      if (API && API.reportsAPI && typeof API.reportsAPI.exportCsv === 'function') {
        response = await API.reportsAPI.exportCsv();
      } else {
        // Fallback to direct axios call
        response = await axios.get('http://localhost:8080/api/reports/csv', { 
          responseType: 'blob' 
        });
      }
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'text/csv' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'campus_room_report.csv');
      
      // Append link to body and trigger click
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating CSV:", error);
      alert("Failed to download CSV report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };
  
  // Generate Excel report
  const generateExcel = async () => {
    try {
      setExportLoading(true);
      
      // Import SheetJS dynamically
      const XLSX = await import('xlsx').then(module => module.default);
      
      // Get report data
      let reportData;
      
      if (API && API.reportsAPI && typeof API.reportsAPI.getReportsData === 'function') {
        const response = await API.reportsAPI.getReportsData(true);
        reportData = response.data;
      } else {
        // Fallback to direct axios call
        const response = await axios.get('http://localhost:8080/api/reports', {
          params: { forceRefresh: true }
        });
        reportData = response.data;
      }
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create worksheet for statistics
      const statsData = [
        { Metric: "Total Reservations", Value: reportData.statistics?.totalReservations || 0 },
        { Metric: "Approved Reservations", Value: reportData.statistics?.approvedReservations || 0 },
        { Metric: "Pending Reservations", Value: reportData.statistics?.pendingReservations || 0 },
        { Metric: "Professor Reservations", Value: reportData.statistics?.professorReservations || 0 },
        { Metric: "Student Reservations", Value: reportData.statistics?.studentReservations || 0 },
        { Metric: "Total Classrooms", Value: reportData.statistics?.totalClassrooms || 0 },
        { Metric: "Total Users", Value: reportData.statistics?.totalUsers || 0 },
        { Metric: "Admin Users", Value: reportData.statistics?.usersByRole?.adminCount || 0 },
        { Metric: "Professor Users", Value: reportData.statistics?.usersByRole?.professorCount || 0 },
        { Metric: "Student Users", Value: reportData.statistics?.usersByRole?.studentCount || 0 },
        { Metric: "Other Users", Value: reportData.statistics?.usersByRole?.otherCount || 0 }
      ];
      
      const statsWS = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWS, "Statistics");
      
      // Create worksheet for popular rooms with role breakdown
      const roomsWS = XLSX.utils.json_to_sheet((reportData.popularRooms || []).map(room => ({
        Room: room.room || '',
        Reservations: room.count || 0,
        "Usage %": ((room.percentage || 0)).toFixed(1),
        "By Professors": room.roleData?.professor || 0,
        "By Students": room.roleData?.student || 0,
        "By Admins": room.roleData?.admin || 0
      })));
      XLSX.utils.book_append_sheet(wb, roomsWS, "Popular Rooms");
      
      // Create worksheet for active users
      const usersWS = XLSX.utils.json_to_sheet((reportData.activeUsers || []).map(user => ({
        User: user.userName || 'Unknown',
        Role: user.role || 'Unknown',
        Reservations: user.count || 0
      })));
      XLSX.utils.book_append_sheet(wb, usersWS, "Active Users");
      
      // Create worksheet for monthly activity
      const activityWS = XLSX.utils.json_to_sheet((reportData.monthlyActivity || []).map(month => ({
        Month: month.month || '',
        "Professor Reservations": month.professorCount || 0,
        "Student Reservations": month.studentCount || 0,
        "Admin Reservations": month.adminCount !== undefined ? month.adminCount : 0,
        Total: month.total || 0
      })));
      XLSX.utils.book_append_sheet(wb, activityWS, "Monthly Activity");
      
      // Write file and trigger download
      XLSX.writeFile(wb, "campus_room_report.xlsx");
    } catch (error) {
      console.error("Error generating Excel report:", error);
      alert("Failed to generate Excel report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };
  
  // Generate PDF report
  const generatePDF = async () => {
    try {
      setExportLoading(true);
      
      // Get PDF data from backend
      let pdfData;
      
      if (API && API.reportsAPI && typeof API.reportsAPI.getPdfData === 'function') {
        const response = await API.reportsAPI.getPdfData();
        pdfData = response.data;
      } else {
        // Fallback to direct axios call
        const response = await axios.get('http://localhost:8080/api/reports/pdf-data');
        pdfData = response.data;
      }
      
      // Set PDF data and show the PDF report modal
      setPDFData(pdfData);
      setShowPDFReport(true);
    } catch (error) {
      console.error("Error generating PDF report:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };
  
  // Close PDF report modal
  const closePDFReport = () => {
    setShowPDFReport(false);
    setPDFData(null);
  };
  
  // Show loading state
  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading report data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="main-content">
      <div className="section-header">
        <h2>System Reports</h2>
        <div className="button-group">
          <button 
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button 
            className="btn-secondary"
            onClick={handleRegenerate}
            disabled={loading}
          >
            <i className="fas fa-redo"></i> Regenerate
          </button>
          <button 
            className="btn-primary"
            onClick={generateCSV}
            disabled={exportLoading}
          >
            {exportLoading ? (
              <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
            ) : (
              <span><i className="fas fa-download"></i> Export CSV</span>
            )}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {/* Overview Stats */}
      <div className="section">
        <h3 className="sub-section-title">System Overview</h3>
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon icon-blue">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-info">
              <h3>Total Reservations</h3>
              <p className="stat-number">{stats.totalReservations || 0}</p>
              <p className="stat-description">
                {stats.approvedReservations || 0} approved, {stats.pendingReservations || 0} pending
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon icon-green">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <h3>User Reservations</h3>
              <p className="stat-number">{stats.professorReservations || 0} / {stats.studentReservations || 0}</p>
              <p className="stat-description">
                Professor / Student reservations
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon icon-yellow">
              <i className="fas fa-door-open"></i>
            </div>
            <div className="stat-info">
              <h3>Rooms Available</h3>
              <p className="stat-number">{stats.totalClassrooms || 0}</p>
              <p className="stat-description">
                Total classrooms in system
              </p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon icon-red">
              <i className="fas fa-user-friends"></i>
            </div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.totalUsers || 0}</p>
              <p className="stat-description">
                {stats.usersByRole?.adminCount || 0} admins, {stats.usersByRole?.professorCount || 0} professors
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Popular Rooms */}
      <div className="section">
        <h3 className="sub-section-title">Most Popular Rooms</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Reservations</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {popularRooms.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">No data available</td>
                </tr>
              ) : (
                popularRooms.map((room, index) => (
                  <tr key={index}>
                    <td>{room.room}</td>
                    <td>{room.count}</td>
                    <td>
                      <div className="progress-bar">
                        <div 
                          className="progress" 
                          style={{ 
                            width: `${Math.min(room.percentage || 0, 100)}%`,
                            backgroundColor: index === 0 ? '#4a6cf7' : index === 1 ? '#6c70dc' : '#8e82c3' 
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Most Active Users */}
      <div className="section">
        <h3 className="sub-section-title">Most Active Users</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Reservations</th>
              </tr>
            </thead>
            <tbody>
              {mostActiveUsers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">No data available</td>
                </tr>
              ) : (
                mostActiveUsers.map((user, index) => (
                  <tr key={index}>
                    <td>{user.userName}</td>
                    <td>{user.role}</td>
                    <td>{user.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Monthly Activity */}
      <div className="section">
        <h3 className="sub-section-title">Monthly Reservation Activity</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Professor</th>
                <th>Student</th>
                <th>Admin</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyActivity.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No data available</td>
                </tr>
              ) : (
                monthlyActivity.map((month, index) => (
                  <tr key={index}>
                    <td>{month.month}</td>
                    <td>{month.professorCount}</td>
                    <td>{month.studentCount}</td>
                    <td>{month.adminCount !== undefined ? month.adminCount : 0}</td>
                    <td>{month.total}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="section">
        <h3 className="sub-section-title">Data Export Options</h3>
        <div className="export-options">
          <div className="export-card">
            <div className="export-icon">
              <i className="fas fa-file-csv"></i>
            </div>
            <div className="export-info">
              <h4>Full Reservations Report</h4>
              <p>Export all reservation data with details</p>
              <button 
                className="btn-primary"
                onClick={generateCSV}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                ) : (
                  <span>Export CSV</span>
                )}
              </button>
            </div>
          </div>
          
          <div className="export-card">
            <div className="export-icon">
              <i className="fas fa-file-excel"></i>
            </div>
            <div className="export-info">
              <h4>Monthly Usage Report</h4>
              <p>Export month-by-month usage statistics</p>
              <button 
                className="btn-primary"
                onClick={generateExcel}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                ) : (
                  <span>Export Excel</span>
                )}
              </button>
            </div>
          </div>
          
          <div className="export-card">
            <div className="export-icon">
              <i className="fas fa-file-pdf"></i>
            </div>
            <div className="export-info">
              <h4>System Status Report</h4>
              <p>Export formatted system status summary</p>
              <button 
                className="btn-primary"
                onClick={generatePDF}
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Processing...</span>
                ) : (
                  <span>Export PDF</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* PDF Report Modal */}
      {showPDFReport && (
        <div className="modal-overlay">
          <div className="modal-content modal-xl">
            <PDFReport data={pdfData} onClose={closePDFReport} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;