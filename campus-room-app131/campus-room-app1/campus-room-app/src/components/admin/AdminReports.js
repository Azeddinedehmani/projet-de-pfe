import React, { useState, useEffect } from 'react';
import '../../styles/dashboard.css';
import SharedDashboardService from '../../services/SharedDashboardService';
import { API } from '../../api'; // Import API from the same source as ClassGroupManagement

const AdminReports = () => {
  // State for REAL data with elegant organization
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
  
  const [detailedRoomData, setDetailedRoomData] = useState([]);
  const [detailedUserActivity, setDetailedUserActivity] = useState([]);
  const [allReservations, setAllReservations] = useState([]);
  const [recentReservations, setRecentReservations] = useState([]);
  const [pendingDemands, setPendingDemands] = useState([]);
  const [roomOccupancy, setRoomOccupancy] = useState([]);
  const [branchesData, setBranchesData] = useState([]);
  const [branchStatistics, setBranchStatistics] = useState({});
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  
  useEffect(() => {
    console.log("AdminReports component mounted - using REAL branch data from same API as ClassGroupManagement");
    fetchDetailedReportData();
  }, [refreshTrigger]);
  
  // Fetch and organize REAL detailed data elegantly
  const fetchDetailedReportData = async () => {
    try {
      console.log("⚠️ Fetching REAL detailed data for elegant presentation");
      setLoading(true);
      setError(null);
      
      // Get REAL data from shared service
      const dashboardData = await SharedDashboardService.fetchDashboardData(true);
      console.log("✅ REAL detailed data received:", dashboardData);
      
      await processDetailedRealData(dashboardData);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error("❌ Error fetching detailed data:", error);
      setError("Failed to load detailed report data: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  // Process REAL data into elegant detailed views
  const processDetailedRealData = async (dashboardData) => {
    // Set basic stats
    if (dashboardData.stats) {
      setStats(dashboardData.stats);
    }
    
    // Set REAL reservations data
    if (dashboardData.allReservations) {
      setAllReservations(dashboardData.allReservations);
    }
    
    if (dashboardData.recentReservations) {
      setRecentReservations(dashboardData.recentReservations);
    }
    
    if (dashboardData.pendingDemands) {
      setPendingDemands(dashboardData.pendingDemands);
    }
    
    // Create detailed room data from REAL reservations
    if (dashboardData.allReservations && dashboardData.classrooms) {
      const roomDetails = createDetailedRoomData(dashboardData.allReservations, dashboardData.classrooms);
      setDetailedRoomData(roomDetails);
    }
    
    // Create detailed user activity from REAL reservations
    if (dashboardData.allReservations && dashboardData.users) {
      const userDetails = createDetailedUserData(dashboardData.allReservations, dashboardData.users);
      setDetailedUserActivity(userDetails);
    }
    
    // Create room occupancy from REAL data
    if (dashboardData.allReservations && dashboardData.classrooms) {
      const occupancy = createRoomOccupancyData(dashboardData.allReservations, dashboardData.classrooms);
      setRoomOccupancy(occupancy);
    }
    
    // Fetch and process REAL branch data using the SAME API as ClassGroupManagement
    await fetchRealBranchData();
  };
  
  // Create detailed room data from REAL reservations
  const createDetailedRoomData = (reservations, classrooms) => {
    const roomMap = {};
    
    // Group reservations by room
    reservations.forEach(reservation => {
      const roomName = reservation.classroom || reservation.room || 'Unknown';
      
      if (!roomMap[roomName]) {
        roomMap[roomName] = {
          roomName,
          totalBookings: 0,
          currentBookings: [],
          recentBookings: [],
          bookingsByRole: { professor: 0, student: 0, admin: 0 },
          bookingsByStatus: { approved: 0, pending: 0, cancelled: 0 },
          mostFrequentUsers: {},
          bookingPurposes: {}
        };
      }
      
      const room = roomMap[roomName];
      room.totalBookings++;
      
      // Add to recent bookings (last 10)
      if (room.recentBookings.length < 10) {
        room.recentBookings.push({
          id: reservation.id,
          user: reservation.reservedBy || reservation.requestedBy,
          role: reservation.role,
          date: reservation.date,
          time: reservation.time,
          status: reservation.status,
          purpose: reservation.purpose
        });
      }
      
      // Count by role
      const role = (reservation.role || 'unknown').toLowerCase();
      if (room.bookingsByRole[role] !== undefined) {
        room.bookingsByRole[role]++;
      }
      
      // Count by status
      const status = (reservation.status || 'unknown').toLowerCase();
      if (room.bookingsByStatus[status] !== undefined) {
        room.bookingsByStatus[status]++;
      }
      
      // Track frequent users
      const user = reservation.reservedBy || reservation.requestedBy || 'Unknown';
      room.mostFrequentUsers[user] = (room.mostFrequentUsers[user] || 0) + 1;
      
      // Track purposes
      if (reservation.purpose) {
        room.bookingPurposes[reservation.purpose] = (room.bookingPurposes[reservation.purpose] || 0) + 1;
      }
      
      // Check if currently booked (today's approved reservations)
      const today = new Date().toISOString().split('T')[0];
      if (reservation.date === today && reservation.status?.toLowerCase() === 'approved') {
        room.currentBookings.push({
          user: reservation.reservedBy || reservation.requestedBy,
          time: reservation.time,
          purpose: reservation.purpose,
          role: reservation.role
        });
      }
    });
    
    // Convert to array and sort by total bookings
    return Object.values(roomMap)
      .map(room => ({
        ...room,
        topUser: Object.entries(room.mostFrequentUsers).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        topPurpose: Object.entries(room.bookingPurposes).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        usagePercentage: reservations.length > 0 ? ((room.totalBookings / reservations.length) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalBookings - a.totalBookings);
  };
  
  // Create detailed user data from REAL reservations
  const createDetailedUserData = (reservations, users) => {
    const userMap = {};
    
    reservations.forEach(reservation => {
      const userName = reservation.reservedBy || reservation.requestedBy || 'Unknown';
      
      if (!userMap[userName]) {
        userMap[userName] = {
          userName,
          totalBookings: 0,
          recentBookings: [],
          role: reservation.role || 'Unknown',
          bookingsByStatus: { approved: 0, pending: 0, cancelled: 0 },
          favoriteRooms: {},
          bookingPurposes: {},
          bookingTimes: {},
          lastBookingDate: null
        };
      }
      
      const user = userMap[userName];
      user.totalBookings++;
      
      // Add to recent bookings (last 5)
      if (user.recentBookings.length < 5) {
        user.recentBookings.push({
          id: reservation.id,
          room: reservation.classroom || reservation.room,
          date: reservation.date,
          time: reservation.time,
          status: reservation.status,
          purpose: reservation.purpose
        });
      }
      
      // Update last booking date
      if (!user.lastBookingDate || reservation.date > user.lastBookingDate) {
        user.lastBookingDate = reservation.date;
      }
      
      // Count by status
      const status = (reservation.status || 'unknown').toLowerCase();
      if (user.bookingsByStatus[status] !== undefined) {
        user.bookingsByStatus[status]++;
      }
      
      // Track favorite rooms
      const room = reservation.classroom || reservation.room || 'Unknown';
      user.favoriteRooms[room] = (user.favoriteRooms[room] || 0) + 1;
      
      // Track purposes
      if (reservation.purpose) {
        user.bookingPurposes[reservation.purpose] = (user.bookingPurposes[reservation.purpose] || 0) + 1;
      }
      
      // Track booking times
      if (reservation.time) {
        const hour = reservation.time.split(':')[0];
        user.bookingTimes[hour] = (user.bookingTimes[hour] || 0) + 1;
      }
    });
    
    // Convert to array and sort by total bookings
    return Object.values(userMap)
      .map(user => ({
        ...user,
        favoriteRoom: Object.entries(user.favoriteRooms).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        topPurpose: Object.entries(user.bookingPurposes).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        preferredTime: Object.entries(user.bookingTimes).sort(([,a], [,b]) => b - a)[0] || ['None', 0],
        successRate: user.totalBookings > 0 ? ((user.bookingsByStatus.approved / user.totalBookings) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.totalBookings - a.totalBookings);
  };
  
  // Create room occupancy data from REAL reservations
  const createRoomOccupancyData = (reservations, classrooms) => {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    
    return classrooms.map(classroom => {
      const roomName = classroom.name || classroom.id;
      
      // Find current reservation
      const currentReservation = reservations.find(r => {
        const reservationHour = parseInt((r.time || '12:00').split(':')[0]);
        return (r.classroom === roomName || r.room === roomName) &&
               r.date === today &&
               r.status?.toLowerCase() === 'approved' &&
               reservationHour <= currentHour &&
               reservationHour + 2 > currentHour; // assuming 2-hour slots
      });
      
      // Find next reservation
      const futureReservations = reservations.filter(r => {
        return (r.classroom === roomName || r.room === roomName) &&
               r.status?.toLowerCase() === 'approved' &&
               (r.date > today || (r.date === today && parseInt((r.time || '12:00').split(':')[0]) > currentHour));
      }).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      });
      
      return {
        roomName,
        isOccupied: !!currentReservation,
        currentReservation: currentReservation ? {
          user: currentReservation.reservedBy || currentReservation.requestedBy,
          role: currentReservation.role,
          purpose: currentReservation.purpose,
          startTime: currentReservation.time,
          endTime: calculateEndTime(currentReservation.time)
        } : null,
        nextReservation: futureReservations[0] ? {
          user: futureReservations[0].reservedBy || futureReservations[0].requestedBy,
          role: futureReservations[0].role,
          date: futureReservations[0].date,
          time: futureReservations[0].time,
          purpose: futureReservations[0].purpose
        } : null,
        todayReservations: reservations.filter(r => 
          (r.classroom === roomName || r.room === roomName) && 
          r.date === today
        ).length
      };
    });
  };
  
  // Helper function to calculate end time
  const calculateEndTime = (startTime) => {
    if (!startTime) return 'Unknown';
    const [hours, minutes] = startTime.split(':');
    const endHour = parseInt(hours) + 2; // assuming 2-hour slots
    return `${endHour.toString().padStart(2, '0')}:${minutes}`;
  };
  
  // Fetch REAL branch data using the SAME APIs as ClassGroupManagement component
  const fetchRealBranchData = async () => {
    try {
      console.log("🏢 Fetching REAL branch data using same API as ClassGroupManagement");
      
      // Use the SAME API endpoint as ClassGroupManagement component
      const branchesResponse = await API.get('/api/branches');
      console.log("✅ Real branches data received:", branchesResponse.data);
      
      if (branchesResponse && branchesResponse.data && branchesResponse.data.length > 0) {
        const processedBranches = await processRealBranchAnalytics(branchesResponse.data);
        setBranchesData(processedBranches);
        
        // Calculate overall branch statistics
        const stats = calculateBranchStatistics(processedBranches);
        setBranchStatistics(stats);
        
        console.log("✅ Processed real branch analytics:", processedBranches);
      } else {
        console.warn("⚠️ No branches data received from API");
        setBranchesData([]);
        setBranchStatistics({
          totalBranches: 0,
          totalStudents: 0,
          totalClassGroups: 0,
          averageStudentsPerBranch: 0,
          averageClassGroupsPerBranch: 0,
          mostPopulated: null,
          leastPopulated: null
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching REAL branch data:', error);
      // Don't fall back to sample data - show error instead
      setError('Failed to load branch data: ' + (error.message || 'Unknown error'));
      setBranchesData([]);
      setBranchStatistics({
        totalBranches: 0,
        totalStudents: 0,
        totalClassGroups: 0,
        averageStudentsPerBranch: 0,
        averageClassGroupsPerBranch: 0,
        mostPopulated: null,
        leastPopulated: null
      });
    }
  };
  
  // Process REAL branch analytics from API data using SAME logic as ClassGroupManagement
  const processRealBranchAnalytics = async (branches) => {
    const processedBranches = [];
    
    for (const branch of branches) {
      try {
        console.log(`Processing branch: ${branch.name} (ID: ${branch.id})`);
        
        // Fetch students for this branch using SAME API as ClassGroupManagement
        let branchStudents = [];
        try {
          const studentsResponse = await API.get(`/api/branches/${branch.id}/students`);
          if (studentsResponse && studentsResponse.data) {
            branchStudents = studentsResponse.data;
            console.log(`✅ Found ${branchStudents.length} students for branch ${branch.name}`);
          }
        } catch (err) {
          console.error(`❌ Error fetching students for branch ${branch.id}:`, err);
        }
        
        // Get class groups from branch data (they should be included in the branch response)
        let branchClassGroups = branch.classGroups || [];
        console.log(`✅ Found ${branchClassGroups.length} class groups for branch ${branch.name}`);
        
        // Calculate branch analytics using REAL data
        const analytics = {
          id: branch.id,
          name: branch.name,
          description: branch.description || 'No description provided',
          totalStudents: branchStudents.length,
          totalClassGroups: branchClassGroups.length,
          students: branchStudents,
          classGroups: branchClassGroups,
          
          // Calculate student analytics from REAL data
          studentsByYear: calculateStudentsByYear(branchStudents),
          studentsByGender: calculateStudentsByGender(branchStudents),
          activeStudents: branchStudents.filter(s => s.status !== 'inactive').length,
          
          // Calculate class group analytics from REAL data
          classGroupsBySemester: calculateClassGroupsBySemester(branchClassGroups),
          totalCourses: branchClassGroups.length,
          activeCourses: branchClassGroups.filter(cg => cg.status !== 'inactive').length,
          
          // Calculate engagement metrics from REAL data
          averageStudentsPerClass: branchClassGroups.length > 0 ? 
            (branchStudents.length / branchClassGroups.length).toFixed(1) : 0,
          
          // Recent activity from REAL data
          recentEnrollments: getRecentEnrollments(branchStudents),
          upcomingClasses: getUpcomingClasses(branchClassGroups)
        };
        
        processedBranches.push(analytics);
        console.log(`✅ Processed analytics for branch ${branch.name}:`, analytics);
        
      } catch (error) {
        console.error(`❌ Error processing branch ${branch.id}:`, error);
        // Still add the branch with basic info even if detailed processing fails
        processedBranches.push({
          id: branch.id,
          name: branch.name,
          description: branch.description || 'No description provided',
          totalStudents: branch.studentsCount || 0,
          totalClassGroups: branch.classGroups ? branch.classGroups.length : 0,
          students: [],
          classGroups: branch.classGroups || [],
          studentsByYear: [],
          studentsByGender: { male: 0, female: 0, other: 0, unspecified: 0 },
          activeStudents: 0,
          classGroupsBySemester: [],
          totalCourses: 0,
          activeCourses: 0,
          averageStudentsPerClass: "0",
          recentEnrollments: [],
          upcomingClasses: []
        });
      }
    }
    
    return processedBranches.sort((a, b) => b.totalStudents - a.totalStudents);
  };
  
  // Helper functions for branch analytics using REAL data
  const calculateStudentsByYear = (students) => {
    const yearCounts = {};
    const currentYear = new Date().getFullYear();
    
    students.forEach(student => {
      // Use enrollmentYear from student data or calculate from createdAt
      const year = student.enrollmentYear || 
        (student.createdAt ? new Date(student.createdAt).getFullYear() : currentYear);
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    return Object.entries(yearCounts)
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => b.year - a.year);
  };
  
  const calculateStudentsByGender = (students) => {
    const genderCounts = { male: 0, female: 0, other: 0, unspecified: 0 };
    
    students.forEach(student => {
      const gender = (student.gender || 'unspecified').toLowerCase();
      if (genderCounts[gender] !== undefined) {
        genderCounts[gender]++;
      } else {
        genderCounts.unspecified++;
      }
    });
    
    return genderCounts;
  };
  
  const calculateClassGroupsBySemester = (classGroups) => {
    const semesterCounts = {};
    
    classGroups.forEach(cg => {
      const key = `${cg.semester} ${cg.academicYear}`;
      semesterCounts[key] = (semesterCounts[key] || 0) + 1;
    });
    
    return Object.entries(semesterCounts)
      .map(([semester, count]) => ({ semester, count }))
      .sort((a, b) => a.semester.localeCompare(b.semester));
  };
  
  const getRecentEnrollments = (students) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return students.filter(student => {
      const enrollmentDate = new Date(student.createdAt || student.enrollmentDate || new Date());
      return enrollmentDate >= oneMonthAgo;
    }).slice(0, 5); // Get last 5 recent enrollments
  };
  
  const getUpcomingClasses = (classGroups) => {
    // Return actual class group data instead of timetable data
    return classGroups.slice(0, 3).map(cg => ({
      courseCode: cg.courseCode,
      name: cg.name,
      semester: cg.semester,
      academicYear: cg.academicYear,
      professorName: cg.professorName
    }));
  };
  
  const calculateBranchStatistics = (branches) => {
    const totalBranches = branches.length;
    const totalStudents = branches.reduce((sum, branch) => sum + branch.totalStudents, 0);
    const totalClassGroups = branches.reduce((sum, branch) => sum + branch.totalClassGroups, 0);
    const averageStudentsPerBranch = totalBranches > 0 ? (totalStudents / totalBranches).toFixed(1) : 0;
    const averageClassGroupsPerBranch = totalBranches > 0 ? (totalClassGroups / totalBranches).toFixed(1) : 0;
    
    // Find most and least populated branches
    const mostPopulated = branches.length > 0 ? 
      branches.reduce((max, branch) => branch.totalStudents > max.totalStudents ? branch : max) : null;
    const leastPopulated = branches.length > 0 ? 
      branches.reduce((min, branch) => branch.totalStudents < min.totalStudents ? branch : min) : null;
    
    return {
      totalBranches,
      totalStudents,
      totalClassGroups,
      averageStudentsPerBranch,
      averageClassGroupsPerBranch,
      mostPopulated,
      leastPopulated
    };
  };
  
  // Export functionality
  const exportToExcel = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      // Dynamic import of xlsx library
      const XLSX = await import('xlsx');
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // 1. Branch Overview Sheet
      const overviewData = [
        ['CAMPUS BRANCH ANALYTICS REPORT', '', '', ''],
        ['Generated on:', new Date().toLocaleDateString(), '', ''],
        ['', '', '', ''],
        ['SYSTEM OVERVIEW', '', '', ''],
        ['Total Branches', branchStatistics.totalBranches || 0, '', ''],
        ['Total Students', branchStatistics.totalStudents || 0, '', ''],
        ['Total Courses', branchStatistics.totalClassGroups || 0, '', ''],
        ['Average Students per Branch', branchStatistics.averageStudentsPerBranch || 0, '', ''],
        ['', '', '', ''],
        ['MOST POPULATED BRANCH', '', '', ''],
        ['Name', branchStatistics.mostPopulated?.name || 'N/A', '', ''],
        ['Students', branchStatistics.mostPopulated?.totalStudents || 0, '', ''],
        ['Courses', branchStatistics.mostPopulated?.totalClassGroups || 0, '', ''],
        ['', '', '', ''],
        ['BRANCH DETAILS', '', '', ''],
        ['Branch Name', 'Total Students', 'Total Courses', 'Avg Students/Class']
      ];
      
      // Add branch details
      branchesData.forEach(branch => {
        overviewData.push([
          branch.name,
          branch.totalStudents,
          branch.totalClassGroups,
          branch.averageStudentsPerClass
        ]);
      });
      
      const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Branch Overview');
      
      // 2. Detailed Branch Data Sheet
      const detailedData = [
        ['DETAILED BRANCH INFORMATION', '', '', '', '', '', '', ''],
        ['Branch Name', 'Description', 'Total Students', 'Active Students', 'Total Courses', 'Active Courses', 'Male Students', 'Female Students']
      ];
      
      branchesData.forEach(branch => {
        detailedData.push([
          branch.name,
          branch.description,
          branch.totalStudents,
          branch.activeStudents,
          branch.totalCourses,
          branch.activeCourses,
          branch.studentsByGender?.male || 0,
          branch.studentsByGender?.female || 0
        ]);
      });
      
      const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed Branch Data');
      
      // 3. Student Enrollment by Year Sheet
      const enrollmentData = [
        ['STUDENT ENROLLMENT BY YEAR', '', '', ''],
        ['Branch Name', 'Year', 'Student Count', 'Percentage of Branch']
      ];
      
      branchesData.forEach(branch => {
        if (branch.studentsByYear && branch.studentsByYear.length > 0) {
          branch.studentsByYear.forEach(yearData => {
            const percentage = branch.totalStudents > 0 ? 
              ((yearData.count / branch.totalStudents) * 100).toFixed(1) : 0;
            enrollmentData.push([
              branch.name,
              yearData.year,
              yearData.count,
              percentage + '%'
            ]);
          });
        }
      });
      
      const enrollmentSheet = XLSX.utils.aoa_to_sheet(enrollmentData);
      XLSX.utils.book_append_sheet(workbook, enrollmentSheet, 'Enrollment by Year');
      
      // 4. Course Distribution Sheet
      const courseData = [
        ['COURSE DISTRIBUTION BY SEMESTER', '', '', ''],
        ['Branch Name', 'Semester', 'Course Count', 'Branch Total Courses']
      ];
      
      branchesData.forEach(branch => {
        if (branch.classGroupsBySemester && branch.classGroupsBySemester.length > 0) {
          branch.classGroupsBySemester.forEach(semesterData => {
            courseData.push([
              branch.name,
              semesterData.semester,
              semesterData.count,
              branch.totalCourses
            ]);
          });
        }
      });
      
      const courseSheet = XLSX.utils.aoa_to_sheet(courseData);
      XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course Distribution');
      
      // 5. Recent Enrollments Sheet
      const recentData = [
        ['RECENT ENROLLMENTS (LAST MONTH)', '', '', '', ''],
        ['Branch Name', 'Student Name', 'Email', 'Enrollment Date', 'ID']
      ];
      
      branchesData.forEach(branch => {
        if (branch.recentEnrollments && branch.recentEnrollments.length > 0) {
          branch.recentEnrollments.forEach(student => {
            recentData.push([
              branch.name,
              `${student.firstName} ${student.lastName}`,
              student.email || 'N/A',
              new Date(student.createdAt).toLocaleDateString(),
              student.id
            ]);
          });
        }
      });
      
      const recentSheet = XLSX.utils.aoa_to_sheet(recentData);
      XLSX.utils.book_append_sheet(workbook, recentSheet, 'Recent Enrollments');
      
      // Style the workbook (add some basic formatting)
      const filename = `Branch_Analytics_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write and download
      XLSX.writeFile(workbook, filename);
      
      setMessage({
        text: `Excel report "${filename}" has been downloaded successfully`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      setError('Failed to export Excel file: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const exportToPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage({ text: '', type: '' });
      
      // Create a new window for PDF
      const printWindow = window.open('', '_blank');
      
      const currentDate = new Date();
      const reportId = `RPT-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getHours()).padStart(2, '0')}${String(currentDate.getMinutes()).padStart(2, '0')}`;
      
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Official Campus Management System Report</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 0;
              color: #000;
              line-height: 1.6;
              font-size: 12pt;
            }
            .document-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20mm;
              background: white;
            }
            .official-header {
              text-align: center;
              border: 3px solid #000;
              padding: 15px;
              margin-bottom: 30px;
              background: #f8f8f8;
            }
            .government-seal {
              width: 60px;
              height: 60px;
              margin: 0 auto 10px;
              border: 2px solid #000;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 20px;
            }
            .official-title {
              font-size: 18pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 10px 0;
              letter-spacing: 1px;
            }
            .department-info {
              font-size: 11pt;
              margin: 5px 0;
              font-weight: bold;
            }
            .document-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
              border: 1px solid #000;
              padding: 10px;
            }
            .doc-field {
              margin-bottom: 8px;
            }
            .doc-label {
              font-weight: bold;
              display: inline-block;
              width: 120px;
            }
            .section-header {
              background: #000;
              color: white;
              padding: 8px 15px;
              font-weight: bold;
              font-size: 14pt;
              margin: 25px 0 15px 0;
              text-transform: uppercase;
            }
            .subsection-header {
              background: #333;
              color: white;
              padding: 6px 12px;
              font-weight: bold;
              font-size: 12pt;
              margin: 20px 0 10px 0;
              border-left: 5px solid #000;
            }
            .official-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              border: 2px solid #000;
            }
            .official-table th {
              background: #000;
              color: white;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #000;
              font-size: 10pt;
            }
            .official-table td {
              padding: 6px 8px;
              border: 1px solid #000;
              font-size: 10pt;
              vertical-align: top;
            }
            .official-table tr:nth-child(even) {
              background: #f5f5f5;
            }
            .stats-section {
              border: 2px solid #000;
              padding: 15px;
              margin: 15px 0;
              background: #fafafa;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 10px 0;
            }
            .stat-box {
              border: 1px solid #000;
              padding: 10px;
              text-align: center;
              background: white;
            }
            .stat-number {
              font-size: 20pt;
              font-weight: bold;
              display: block;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 9pt;
              text-transform: uppercase;
              font-weight: bold;
            }
            .executive-summary {
              border: 2px solid #000;
              padding: 15px;
              margin: 20px 0;
              background: #f8f8f8;
            }
            .signature-section {
              margin-top: 40px;
              border: 1px solid #000;
              padding: 20px;
            }
            .signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 30px;
            }
            .signature-block {
              text-align: center;
            }
            .signature-line {
              border-bottom: 2px solid #000;
              height: 40px;
              margin-bottom: 10px;
            }
            .official-footer {
              margin-top: 30px;
              text-align: center;
              border-top: 2px solid #000;
              padding-top: 15px;
              font-size: 10pt;
            }
            .page-break {
              page-break-before: always;
            }
            .confidential {
              position: fixed;
              top: 10mm;
              right: 10mm;
              background: #ff0000;
              color: white;
              padding: 5px 10px;
              font-weight: bold;
              transform: rotate(45deg);
              font-size: 10pt;
            }
            .toc {
              border: 1px solid #000;
              padding: 15px;
              margin: 20px 0;
            }
            .toc-item {
              padding: 3px 0;
              border-bottom: 1px dotted #ccc;
            }
            .status-approved { color: #006400; font-weight: bold; }
            .status-pending { color: #ff8c00; font-weight: bold; }
            .status-cancelled { color: #dc143c; font-weight: bold; }
            .critical-info {
              background: #ffffcc;
              border: 2px solid #ffcc00;
              padding: 10px;
              margin: 10px 0;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .document-container { padding: 15mm; }
              .page-break { page-break-before: always; }
              @page { 
                size: A4; 
                margin: 15mm;
                @bottom-right {
                  content: "Page " counter(page) " of " counter(pages);
                }
                @bottom-left {
                  content: "${reportId}";
                }
              }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            
            <!-- OFFICIAL HEADER -->
            <div class="official-header">
              <div class="government-seal">🏛️</div>
              <div class="official-title">OFFICIAL ADMINISTRATIVE REPORT</div>
              <div class="department-info">CAMPUS FACILITIES MANAGEMENT DEPARTMENT</div>
              <div class="department-info">ROOM RESERVATION & ACADEMIC RESOURCES SYSTEM</div>
              <div style="font-size: 10pt; margin-top: 10px;">CLASSIFICATION: INTERNAL USE - ADMINISTRATIVE</div>
            </div>
            
            <!-- DOCUMENT IDENTIFICATION -->
            <div class="document-info">
              <div>
                <div class="doc-field">
                  <span class="doc-label">REPORT ID:</span>
                  <span>${reportId}</span>
                </div>
                <div class="doc-field">
                  <span class="doc-label">GENERATED:</span>
                  <span>${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}</span>
                </div>
                <div class="doc-field">
                  <span class="doc-label">PERIOD:</span>
                  <span>Current System Status</span>
                </div>
                <div class="doc-field">
                  <span class="doc-label">AUTHORITY:</span>
                  <span>System Administrator</span>
                </div>
              </div>
              <div>
                <div class="doc-field">
                  <span class="doc-label">DOCUMENT TYPE:</span>
                  <span>Comprehensive System Report</span>
                </div>
                <div class="doc-field">
                  <span class="doc-label">SCOPE:</span>
                  <span>Campus-wide Analysis</span>
                </div>
                <div class="doc-field">
                  <span class="doc-label">VERSION:</span>
                  <span>1.0</span>
                </div>
                <div class="doc-field">
                  <span class="doc-label">STATUS:</span>
                  <span>OFFICIAL</span>
                </div>
              </div>
            </div>
            
            <!-- TABLE OF CONTENTS -->
            <div class="toc">
              <h3 style="margin-top: 0; text-align: center; text-decoration: underline;">TABLE OF CONTENTS</h3>
              <div class="toc-item">1. EXECUTIVE SUMMARY ................................................... Page 1</div>
              <div class="toc-item">2. SYSTEM PERFORMANCE OVERVIEW ................................. Page 2</div>
              <div class="toc-item">3. FACILITY UTILIZATION ANALYSIS ................................. Page 3</div>
              <div class="toc-item">4. USER ACTIVITY ASSESSMENT ....................................... Page 4</div>
              <div class="toc-item">5. ACADEMIC BRANCH OPERATIONS .................................... Page 5</div>
              <div class="toc-item">6. REAL-TIME STATUS MONITORING ................................... Page 7</div>
              <div class="toc-item">7. RESERVATION MANAGEMENT RECORDS ............................... Page 8</div>
              <div class="toc-item">8. CONCLUSIONS AND RECOMMENDATIONS ............................. Page 9</div>
              <div class="toc-item">9. OFFICIAL CERTIFICATIONS ........................................ Page 10</div>
            </div>
            
            <!-- EXECUTIVE SUMMARY -->
            <div class="page-break"></div>
            <div class="section-header">1. EXECUTIVE SUMMARY</div>
            <div class="executive-summary">
              <h4 style="margin-top: 0;">SYSTEM STATUS OVERVIEW</h4>
              <p><strong>This official report presents a comprehensive analysis of the Campus Room Management System as of ${currentDate.toLocaleDateString()}.</strong></p>
              
              <div class="critical-info">
                <strong>KEY FINDINGS:</strong> The system currently manages ${stats.totalClassrooms || 0} classroom facilities, 
                ${stats.activeReservations || 0} active reservations, and serves ${stats.totalUsers || 0} registered users 
                across ${branchStatistics.totalBranches || 0} academic branches.
              </div>
              
              <p><strong>SCOPE OF ANALYSIS:</strong> This report encompasses facility utilization, user activity patterns, 
              academic branch operations, real-time system monitoring, and comprehensive reservation management records.</p>
              
              <p><strong>DATA INTEGRITY:</strong> All data presented herein is sourced directly from the live campus management 
              system and represents real-time operational status as of report generation time.</p>
              
              <p><strong>COMPLIANCE:</strong> This report is prepared in accordance with institutional reporting standards 
              and administrative oversight requirements.</p>
            </div>
            
            <!-- SYSTEM PERFORMANCE OVERVIEW -->
            <div class="page-break"></div>
            <div class="section-header">2. SYSTEM PERFORMANCE OVERVIEW</div>
            
            <div class="stats-section">
              <h4 style="margin-top: 0;">OPERATIONAL METRICS</h4>
              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-number">${stats.totalClassrooms || 0}</span>
                  <span class="stat-label">Total Facilities</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">${stats.activeReservations || 0}</span>
                  <span class="stat-label">Active Reservations</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">${stats.pendingDemands || 0}</span>
                  <span class="stat-label">Pending Approvals</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">${stats.totalUsers || 0}</span>
                  <span class="stat-label">Registered Users</span>
                </div>
              </div>
            </div>
            
            <div class="subsection-header">2.1 FACILITY STATUS SUMMARY</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>METRIC</th>
                  <th>CURRENT VALUE</th>
                  <th>STATUS</th>
                  <th>REMARKS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Classroom Facilities</td>
                  <td>${stats.totalClassrooms || 0}</td>
                  <td>OPERATIONAL</td>
                  <td>${stats.classroomDetails || 'All facilities functional'}</td>
                </tr>
                <tr>
                  <td>Active Reservations</td>
                  <td>${stats.activeReservations || 0}</td>
                  <td>MONITORING</td>
                  <td>Currently approved bookings</td>
                </tr>
                <tr>
                  <td>Pending Approval Requests</td>
                  <td>${stats.pendingDemands || 0}</td>
                  <td>${stats.pendingDemands > 10 ? 'ATTENTION REQUIRED' : 'NORMAL'}</td>
                  <td>Awaiting administrative review</td>
                </tr>
                <tr>
                  <td>System Users</td>
                  <td>${stats.totalUsers || 0}</td>
                  <td>ACTIVE</td>
                  <td>${stats.userDetails || 'Registered active users'}</td>
                </tr>
                <tr>
                  <td>Academic Groups</td>
                  <td>${stats.totalClassGroups || 0}</td>
                  <td>OPERATIONAL</td>
                  <td>Active class group registrations</td>
                </tr>
              </tbody>
            </table>
            
            <!-- FACILITY UTILIZATION ANALYSIS -->
            <div class="page-break"></div>
            <div class="section-header">3. FACILITY UTILIZATION ANALYSIS</div>
            
            <div class="subsection-header">3.1 ROOM PERFORMANCE METRICS</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>FACILITY NAME</th>
                  <th>TOTAL BOOKINGS</th>
                  <th>UTILIZATION RATE</th>
                  <th>PRIMARY USER CATEGORY</th>
                  <th>CURRENT STATUS</th>
                  <th>OPERATIONAL NOTES</th>
                </tr>
              </thead>
              <tbody>
                ${detailedRoomData.slice(0, 20).map(room => `
                  <tr>
                    <td><strong>${room.roomName}</strong></td>
                    <td>${room.totalBookings}</td>
                    <td>${room.usagePercentage}%</td>
                    <td>Professor: ${room.bookingsByRole.professor}, Student: ${room.bookingsByRole.student}, Admin: ${room.bookingsByRole.admin}</td>
                    <td>${room.currentBookings.length > 0 ? 'OCCUPIED' : 'AVAILABLE'}</td>
                    <td>Most frequent user: ${room.topUser[0]} (${room.topUser[1]} bookings)</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- USER ACTIVITY ASSESSMENT -->
            <div class="page-break"></div>
            <div class="section-header">4. USER ACTIVITY ASSESSMENT</div>
            
            <div class="subsection-header">4.1 USER ENGAGEMENT ANALYSIS</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>USER IDENTIFICATION</th>
                  <th>ROLE CLASSIFICATION</th>
                  <th>TOTAL RESERVATIONS</th>
                  <th>SUCCESS RATE</th>
                  <th>PREFERRED FACILITY</th>
                  <th>LAST ACTIVITY</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${detailedUserActivity.slice(0, 25).map(user => `
                  <tr>
                    <td><strong>${user.userName}</strong></td>
                    <td>${user.role.toUpperCase()}</td>
                    <td>${user.totalBookings}</td>
                    <td>${user.successRate}%</td>
                    <td>${user.favoriteRoom[0]} (${user.favoriteRoom[1]} times)</td>
                    <td>${user.lastBookingDate || 'N/A'}</td>
                    <td>${user.successRate >= 80 ? 'ACTIVE' : user.successRate >= 50 ? 'MODERATE' : 'INACTIVE'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="subsection-header">4.2 RESERVATION STATUS BREAKDOWN</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>USER CATEGORY</th>
                  <th>APPROVED RESERVATIONS</th>
                  <th>PENDING RESERVATIONS</th>
                  <th>CANCELLED RESERVATIONS</th>
                  <th>TOTAL REQUESTS</th>
                  <th>APPROVAL RATE</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const roleStats = { professor: {approved: 0, pending: 0, cancelled: 0}, student: {approved: 0, pending: 0, cancelled: 0}, admin: {approved: 0, pending: 0, cancelled: 0} };
                  detailedUserActivity.forEach(user => {
                    const role = user.role.toLowerCase();
                    if (roleStats[role]) {
                      roleStats[role].approved += user.bookingsByStatus.approved;
                      roleStats[role].pending += user.bookingsByStatus.pending;
                      roleStats[role].cancelled += user.bookingsByStatus.cancelled;
                    }
                  });
                  return Object.entries(roleStats).map(([role, stats]) => {
                    const total = stats.approved + stats.pending + stats.cancelled;
                    const rate = total > 0 ? ((stats.approved / total) * 100).toFixed(1) : 0;
                    return `
                      <tr>
                        <td><strong>${role.toUpperCase()}</strong></td>
                        <td>${stats.approved}</td>
                        <td>${stats.pending}</td>
                        <td>${stats.cancelled}</td>
                        <td>${total}</td>
                        <td>${rate}%</td>
                      </tr>
                    `;
                  }).join('');
                })()}
              </tbody>
            </table>
            
            <!-- ACADEMIC BRANCH OPERATIONS -->
            <div class="page-break"></div>
            <div class="section-header">5. ACADEMIC BRANCH OPERATIONS</div>
            
            <div class="subsection-header">5.1 INSTITUTIONAL BRANCH OVERVIEW</div>
            <div class="stats-section">
              <div class="stats-grid">
                <div class="stat-box">
                  <span class="stat-number">${branchStatistics.totalBranches || 0}</span>
                  <span class="stat-label">Academic Branches</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">${branchStatistics.totalStudents || 0}</span>
                  <span class="stat-label">Total Students</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">${branchStatistics.totalClassGroups || 0}</span>
                  <span class="stat-label">Active Courses</span>
                </div>
                <div class="stat-box">
                  <span class="stat-number">${branchStatistics.averageStudentsPerBranch || 0}</span>
                  <span class="stat-label">Avg Students/Branch</span>
                </div>
              </div>
            </div>
            
            <div class="subsection-header">5.2 BRANCH PERFORMANCE ANALYSIS</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>BRANCH DESIGNATION</th>
                  <th>ENROLLED STUDENTS</th>
                  <th>ACTIVE STUDENTS</th>
                  <th>COURSE OFFERINGS</th>
                  <th>GENDER DISTRIBUTION</th>
                  <th>PERFORMANCE RATING</th>
                  <th>OPERATIONAL STATUS</th>
                </tr>
              </thead>
              <tbody>
                ${branchesData.map((branch, index) => `
                  <tr>
                    <td><strong>${branch.name}</strong></td>
                    <td>${branch.totalStudents}</td>
                    <td>${branch.activeStudents}</td>
                    <td>${branch.totalCourses}</td>
                    <td>M: ${branch.studentsByGender?.male || 0}, F: ${branch.studentsByGender?.female || 0}</td>
                    <td>${index === 0 ? 'EXCELLENT' : index < 3 ? 'GOOD' : 'SATISFACTORY'}</td>
                    <td>OPERATIONAL</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="subsection-header">5.3 ENROLLMENT TRENDS BY ACADEMIC YEAR</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>BRANCH</th>
                  <th>ENROLLMENT YEAR</th>
                  <th>STUDENT COUNT</th>
                  <th>PERCENTAGE OF BRANCH</th>
                  <th>TREND ANALYSIS</th>
                </tr>
              </thead>
              <tbody>
                ${branchesData.map(branch => 
                  (branch.studentsByYear || []).map(yearData => {
                    const percentage = branch.totalStudents > 0 ? (yearData.count / branch.totalStudents * 100).toFixed(1) : 0;
                    return `
                      <tr>
                        <td>${branch.name}</td>
                        <td>${yearData.year}</td>
                        <td>${yearData.count}</td>
                        <td>${percentage}%</td>
                        <td>${yearData.year >= 2023 ? 'RECENT' : yearData.year >= 2020 ? 'CURRENT' : 'LEGACY'}</td>
                      </tr>
                    `;
                  }).join('')
                ).join('')}
              </tbody>
            </table>
            
            <!-- REAL-TIME STATUS MONITORING -->
            <div class="page-break"></div>
            <div class="section-header">6. REAL-TIME STATUS MONITORING</div>
            
            <div class="subsection-header">6.1 CURRENT FACILITY OCCUPANCY</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>FACILITY IDENTIFIER</th>
                  <th>CURRENT STATUS</th>
                  <th>OCCUPANT DETAILS</th>
                  <th>RESERVATION TIME</th>
                  <th>PURPOSE</th>
                  <th>NEXT SCHEDULED</th>
                  <th>TODAY'S BOOKINGS</th>
                </tr>
              </thead>
              <tbody>
                ${roomOccupancy.map(room => `
                  <tr>
                    <td><strong>${room.roomName}</strong></td>
                    <td class="${room.isOccupied ? 'status-pending' : 'status-approved'}">${room.isOccupied ? 'OCCUPIED' : 'AVAILABLE'}</td>
                    <td>${room.currentReservation ? `${room.currentReservation.user} (${room.currentReservation.role})` : 'None'}</td>
                    <td>${room.currentReservation ? `${room.currentReservation.startTime} - ${room.currentReservation.endTime}` : 'N/A'}</td>
                    <td>${room.currentReservation?.purpose || 'N/A'}</td>
                    <td>${room.nextReservation ? `${room.nextReservation.user} at ${room.nextReservation.time}` : 'None scheduled'}</td>
                    <td>${room.todayReservations}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- RESERVATION MANAGEMENT RECORDS -->
            <div class="page-break"></div>
            <div class="section-header">7. RESERVATION MANAGEMENT RECORDS</div>
            
            <div class="subsection-header">7.1 RECENT RESERVATION ACTIVITY</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>RESERVATION ID</th>
                  <th>FACILITY</th>
                  <th>REQUESTING PARTY</th>
                  <th>ROLE</th>
                  <th>SCHEDULED DATE/TIME</th>
                  <th>PURPOSE</th>
                  <th>STATUS</th>
                  <th>APPROVAL DATE</th>
                </tr>
              </thead>
              <tbody>
                ${recentReservations.slice(0, 30).map(reservation => `
                  <tr>
                    <td><strong>${reservation.id}</strong></td>
                    <td>${reservation.classroom}</td>
                    <td>${reservation.reservedBy}</td>
                    <td>${reservation.role?.toUpperCase()}</td>
                    <td>${reservation.date} ${reservation.time}</td>
                    <td>${reservation.purpose || 'Standard booking'}</td>
                    <td class="status-${reservation.status?.toLowerCase()}">${reservation.status?.toUpperCase()}</td>
                    <td>${reservation.status === 'approved' ? reservation.date : 'Pending'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="subsection-header">7.2 PENDING APPROVAL REQUESTS</div>
            <table class="official-table">
              <thead>
                <tr>
                  <th>REQUEST ID</th>
                  <th>FACILITY REQUESTED</th>
                  <th>REQUESTING PARTY</th>
                  <th>SUBMISSION DATE</th>
                  <th>REQUESTED DATE/TIME</th>
                  <th>PURPOSE</th>
                  <th>PRIORITY LEVEL</th>
                  <th>DAYS PENDING</th>
                </tr>
              </thead>
              <tbody>
                ${pendingDemands.map((demand, index) => {
                  const submissionDate = new Date(demand.date);
                  const daysPending = Math.floor((currentDate - submissionDate) / (1000 * 60 * 60 * 24));
                  return `
                    <tr>
                      <td><strong>${demand.id}</strong></td>
                      <td>${demand.classroom}</td>
                      <td>${demand.reservedBy || demand.requestedBy}</td>
                      <td>${demand.date}</td>
                      <td>${demand.date} ${demand.time}</td>
                      <td>${demand.purpose || 'Standard request'}</td>
                      <td>${daysPending > 7 ? 'HIGH' : daysPending > 3 ? 'MEDIUM' : 'NORMAL'}</td>
                      <td>${daysPending} days</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <!-- CONCLUSIONS AND RECOMMENDATIONS -->
            <div class="page-break"></div>
            <div class="section-header">8. CONCLUSIONS AND RECOMMENDATIONS</div>
            
            <div class="executive-summary">
              <h4 style="margin-top: 0;">OPERATIONAL ASSESSMENT</h4>
              
              <p><strong>SYSTEM PERFORMANCE:</strong> The Campus Room Management System is operating within normal parameters 
              with ${stats.totalClassrooms || 0} facilities under management and ${stats.activeReservations || 0} active reservations.</p>
              
              <p><strong>UTILIZATION EFFICIENCY:</strong> Current facility utilization rates indicate 
              ${roomOccupancy.filter(r => r.isOccupied).length} of ${roomOccupancy.length} rooms are currently occupied 
              (${roomOccupancy.length > 0 ? ((roomOccupancy.filter(r => r.isOccupied).length / roomOccupancy.length) * 100).toFixed(1) : 0}% occupancy rate).</p>
              
              <p><strong>PENDING MATTERS:</strong> ${stats.pendingDemands || 0} reservation requests await administrative approval. 
              ${stats.pendingDemands > 10 ? 'IMMEDIATE ATTENTION REQUIRED to clear approval backlog.' : 'Current pending volume is within acceptable limits.'}</p>
              
              <p><strong>ACADEMIC INTEGRATION:</strong> ${branchStatistics.totalBranches || 0} academic branches are actively 
              utilizing the system with ${branchStatistics.totalStudents || 0} registered students across ${branchStatistics.totalClassGroups || 0} course offerings.</p>
              
              <div class="critical-info">
                <strong>ADMINISTRATIVE RECOMMENDATIONS:</strong>
                <br>1. ${stats.pendingDemands > 10 ? 'Prioritize processing of pending approval requests' : 'Maintain current approval processing schedule'}
                <br>2. ${branchStatistics.totalBranches > 0 ? 'Continue monitoring branch-level utilization patterns' : 'Implement branch-level tracking system'}
                <br>3. Regular system maintenance and user activity monitoring should continue
                <br>4. Consider facility expansion if utilization consistently exceeds 85%
              </div>
            </div>
            
            <!-- OFFICIAL CERTIFICATIONS -->
            <div class="page-break"></div>
            <div class="section-header">9. OFFICIAL CERTIFICATIONS</div>
            
            <div class="signature-section">
              <h4 style="margin-top: 0;">DOCUMENT AUTHENTICATION</h4>
              
              <p>I hereby certify that the information contained in this official report is accurate and complete 
              as of the date of generation. All data has been extracted directly from the live campus management system 
              and represents the current operational status of the facility reservation system.</p>
              
              <p><strong>REPORT VALIDITY:</strong> This document is considered official for administrative purposes 
              and may be referenced in operational planning, resource allocation, and institutional reporting.</p>
              
              <p><strong>DATA CLASSIFICATION:</strong> Internal Use - Administrative Personnel Only</p>
              
              <div class="signature-grid">
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <strong>System Administrator</strong><br>
                  Campus Facilities Management<br>
                  Date: ${currentDate.toLocaleDateString()}
                </div>
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <strong>Department Head</strong><br>
                  Academic Operations<br>
                  Date: _________________
                </div>
              </div>
              
              <div style="margin-top: 30px; text-align: center; border: 1px solid #000; padding: 15px;">
                <strong>OFFICIAL SEAL</strong><br>
                <div style="margin: 10px 0; font-size: 14pt;">🏛️</div>
                <strong>CAMPUS ADMINISTRATION</strong><br>
                Document ID: ${reportId}<br>
                Generated: ${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}
              </div>
            </div>
            
            <!-- OFFICIAL FOOTER -->
            <div class="official-footer">
              <div style="border-top: 2px solid #000; padding-top: 10px;">
                <strong>CAMPUS FACILITIES MANAGEMENT DEPARTMENT</strong><br>
                Room Reservation & Academic Resources System<br>
                Report ID: ${reportId} | Generated: ${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}<br>
                <em>This document contains official administrative data - Handle in accordance with institutional policies</em>
              </div>
            </div>
            
            <!-- END OF DOCUMENT -->
            <div style="text-align: center; margin-top: 30px; font-weight: bold; font-size: 14pt;">
              === END OF OFFICIAL REPORT ===
            </div>
            
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 1000);
      };
      
      setMessage({
        text: `Official administrative report (ID: ${reportId}) has been generated and sent to your printer/PDF viewer`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Failed to export official PDF report: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  // Event handlers
  const handleRefresh = () => {
    console.log("Refreshing REAL detailed reports");
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleRegenerate = async () => {
    try {
      setLoading(true);
      SharedDashboardService.invalidateCache();
      await fetchDetailedReportData();
      console.log("REAL detailed reports regenerated successfully");
    } catch (error) {
      console.error("Error regenerating detailed reports:", error);
      setError("Failed to regenerate reports: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading detailed system reports...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="main-content">
      {/* Elegant Header */}
      <div className="elegant-header">
        <div className="header-content">
          <h1>📊 System Analytics & Detailed Reports</h1>
          <p className="header-subtitle">Comprehensive view of campus room booking system with REAL branch data</p>
          {lastUpdated && (
            <div className="last-updated-info">
              🕒 Last updated: {lastUpdated.toLocaleString()} | 🔄 Synced with Real Data
            </div>
          )}
        </div>
        
        <div className="header-controls">
          <button 
            className="btn-elegant refresh"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh detailed data"
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
          <button 
            className="btn-elegant regenerate"
            onClick={handleRegenerate}
            disabled={loading}
            title="Clear cache and regenerate"
          >
            <i className="fas fa-redo"></i> Regenerate
          </button>
          <button 
            className="btn-elegant export-excel"
            onClick={exportToExcel}
            disabled={loading || branchesData.length === 0}
            title="Export branch data to Excel"
          >
            <i className="fas fa-file-excel"></i> Export Excel
          </button>
          <button 
            className="btn-elegant export-pdf"
            onClick={exportToPDF}
            disabled={loading || branchesData.length === 0}
            title="Export branch data to PDF"
          >
            <i className="fas fa-file-pdf"></i> Export PDF
          </button>
        </div>
      </div>
      
      {error && (
        <div className="elegant-alert error">
          <i className="fas fa-exclamation-triangle"></i>
          <div>
            <strong>Error Loading Data</strong>
            <p>{error}</p>
          </div>
          <button className="btn-retry" onClick={handleRefresh}>
            <i className="fas fa-sync-alt"></i> Retry
          </button>
        </div>
      )}

      {message.text && (
        <div className={`elegant-alert ${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}`}></i>
          <div>
            <strong>{message.type === 'success' ? 'Success' : 'Information'}</strong>
            <p>{message.text}</p>
          </div>
          <button className="btn-close-alert" onClick={() => setMessage({ text: '', type: '' })}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Elegant Navigation */}
      <div className="elegant-nav">
        <button 
          className={`nav-item ${selectedView === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedView('overview')}
        >
          <i className="fas fa-chart-pie"></i>
          <span>System Overview</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'rooms' ? 'active' : ''}`}
          onClick={() => setSelectedView('rooms')}
        >
          <i className="fas fa-door-open"></i>
          <span>Room Details</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'users' ? 'active' : ''}`}
          onClick={() => setSelectedView('users')}
        >
          <i className="fas fa-users"></i>
          <span>User Activity</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'branches' ? 'active' : ''}`}
          onClick={() => setSelectedView('branches')}
        >
          <i className="fas fa-sitemap"></i>
          <span>Branches</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'occupancy' ? 'active' : ''}`}
          onClick={() => setSelectedView('occupancy')}
        >
          <i className="fas fa-clock"></i>
          <span>Live Status</span>
        </button>
        <button 
          className={`nav-item ${selectedView === 'reservations' ? 'active' : ''}`}
          onClick={() => setSelectedView('reservations')}
        >
          <i className="fas fa-calendar-alt"></i>
          <span>All Reservations</span>
        </button>
      </div>

      {/* System Overview */}
      {selectedView === 'overview' && (
        <>
          <div className="elegant-section">
            <h2 className="section-title">📈 System Performance Metrics</h2>
            <div className="stats-grid elegant">
              <div className="stat-card elegant primary">
                <div className="stat-icon">
                  <i className="fas fa-building"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Classrooms</h3>
                  <div className="stat-number">{stats.totalClassrooms || 0}</div>
                  <div className="stat-description">{stats.classroomDetails || 'Available facilities'}</div>
                </div>
              </div>
              
              <div className="stat-card elegant success">
                <div className="stat-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-content">
                  <h3>Active Reservations</h3>
                  <div className="stat-number">{stats.activeReservations || 0}</div>
                  <div className="stat-description">Currently approved bookings</div>
                </div>
              </div>
              
              <div className="stat-card elegant warning">
                <div className="stat-icon">
                  <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="stat-content">
                  <h3>Pending Approvals</h3>
                  <div className="stat-number">{stats.pendingDemands || 0}</div>
                  <div className="stat-description">Awaiting administrator review</div>
                </div>
              </div>
              
              <div className="stat-card elegant info">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>System Users</h3>
                  <div className="stat-number">{stats.totalUsers || 0}</div>
                  <div className="stat-description">{stats.userDetails || 'Registered users'}</div>
                </div>
              </div>
              
              <div className="stat-card elegant secondary">
                <div className="stat-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="stat-content">
                  <h3>Class Groups</h3>
                  <div className="stat-number">{stats.totalClassGroups || 0}</div>
                  <div className="stat-description">Active academic groups</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detailed Room Information */}
      {selectedView === 'rooms' && (
        <div className="elegant-section">
          <h2 className="section-title">🏢 Detailed Room Analysis</h2>
          <div className="room-cards-grid">
            {detailedRoomData.length === 0 ? (
              <div className="no-data-message elegant">
                <i className="fas fa-info-circle"></i>
                <p>No room data available</p>
              </div>
            ) : (
              detailedRoomData.map((room, index) => (
                <div key={index} className="room-card elegant">
                  <div className="room-header">
                    <h3>{room.roomName}</h3>
                    <div className="room-status">
                      {room.currentBookings.length > 0 ? (
                        <span className="status occupied">🔴 Currently Occupied</span>
                      ) : (
                        <span className="status available">🟢 Available</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="room-stats">
                    <div className="stat-item">
                      <span className="label">Total Bookings:</span>
                      <span className="value">{room.totalBookings}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Usage Rate:</span>
                      <span className="value">{room.usagePercentage}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Most Frequent User:</span>
                      <span className="value">{room.topUser[0]} ({room.topUser[1]} times)</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Common Purpose:</span>
                      <span className="value">{room.topPurpose[0]}</span>
                    </div>
                  </div>
                  
                  {room.currentBookings.length > 0 && (
                    <div className="current-booking">
                      <h4>Current Booking:</h4>
                      {room.currentBookings.map((booking, idx) => (
                        <div key={idx} className="booking-info">
                          <div>👤 {booking.user} ({booking.role})</div>
                          <div>⏰ {booking.time}</div>
                          <div>📝 {booking.purpose}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="role-breakdown">
                    <h4>Bookings by Role:</h4>
                    <div className="role-stats">
                      <div className="role-item">
                        <span>👨‍🏫 Professors:</span>
                        <span>{room.bookingsByRole.professor}</span>
                      </div>
                      <div className="role-item">
                        <span>👨‍🎓 Students:</span>
                        <span>{room.bookingsByRole.student}</span>
                      </div>
                      <div className="role-item">
                        <span>👨‍💼 Admins:</span>
                        <span>{room.bookingsByRole.admin}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="recent-bookings">
                    <h4>Recent Bookings:</h4>
                    <div className="bookings-list">
                      {room.recentBookings.slice(0, 3).map((booking, idx) => (
                        <div key={idx} className="booking-item">
                          <div className="booking-user">👤 {booking.user}</div>
                          <div className="booking-details">
                            📅 {booking.date} ⏰ {booking.time}
                            <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Detailed User Activity */}
      {selectedView === 'users' && (
        <div className="elegant-section">
          <h2 className="section-title">👥 User Activity Analysis</h2>
          <div className="user-cards-grid">
            {detailedUserActivity.length === 0 ? (
              <div className="no-data-message elegant">
                <i className="fas fa-info-circle"></i>
                <p>No user activity data available</p>
              </div>
            ) : (
              detailedUserActivity.map((user, index) => (
                <div key={index} className="user-card elegant">
                  <div className="user-header">
                    <div className="user-info">
                      <h3>{user.userName}</h3>
                      <span className={`role-badge ${user.role?.toLowerCase()}`}>
                        {user.role === 'professor' ? '👨‍🏫' : user.role === 'student' ? '👨‍🎓' : '👨‍💼'} {user.role}
                      </span>
                    </div>
                    <div className="user-rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                  </div>
                  
                  <div className="user-stats">
                    <div className="stat-item">
                      <span className="label">Total Bookings:</span>
                      <span className="value">{user.totalBookings}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Success Rate:</span>
                      <span className="value">{user.successRate}%</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Last Booking:</span>
                      <span className="value">{user.lastBookingDate || 'N/A'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Favorite Room:</span>
                      <span className="value">{user.favoriteRoom[0]} ({user.favoriteRoom[1]} times)</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Common Purpose:</span>
                      <span className="value">{user.topPurpose[0]}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Preferred Time:</span>
                      <span className="value">{user.preferredTime[0]}:00</span>
                    </div>
                  </div>
                  
                  <div className="booking-status-breakdown">
                    <h4>Booking Status:</h4>
                    <div className="status-stats">
                      <div className="status-item approved">
                        <span>✅ Approved:</span>
                        <span>{user.bookingsByStatus.approved}</span>
                      </div>
                      <div className="status-item pending">
                        <span>⏳ Pending:</span>
                        <span>{user.bookingsByStatus.pending}</span>
                      </div>
                      <div className="status-item cancelled">
                        <span>❌ Cancelled:</span>
                        <span>{user.bookingsByStatus.cancelled}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="recent-user-bookings">
                    <h4>Recent Bookings:</h4>
                    <div className="bookings-list">
                      {user.recentBookings.slice(0, 3).map((booking, idx) => (
                        <div key={idx} className="booking-item">
                          <div className="booking-room">🏢 {booking.room}</div>
                          <div className="booking-details">
                            📅 {booking.date} ⏰ {booking.time}
                            <span className={`status-badge ${booking.status?.toLowerCase()}`}>
                              {booking.status}
                            </span>
                          </div>
                          {booking.purpose && (
                            <div className="booking-purpose">📝 {booking.purpose}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* REAL Branch Analytics */}
      {selectedView === 'branches' && (
        <>
          {/* Branch Overview Statistics */}
          <div className="elegant-section">
            <h2 className="section-title">🏛️ REAL Branch Analytics Overview</h2>
            <div className="export-info">
              <div className="info-banner export-banner">
                <i className="fas fa-download"></i>
                <span>
                  Export comprehensive branch reports including student demographics, course distribution, 
                  enrollment trends, and detailed analytics in Excel or PDF format
                </span>
              </div>
            </div>
            <div className="stats-grid elegant">
              <div className="stat-card elegant primary">
                <div className="stat-icon">
                  <i className="fas fa-sitemap"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Branches</h3>
                  <div className="stat-number">{branchStatistics.totalBranches || 0}</div>
                  <div className="stat-description">Academic departments</div>
                </div>
              </div>
              
              <div className="stat-card elegant success">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Students</h3>
                  <div className="stat-number">{branchStatistics.totalStudents || 0}</div>
                  <div className="stat-description">Across all branches</div>
                </div>
              </div>
              
              <div className="stat-card elegant info">
                <div className="stat-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="stat-content">
                  <h3>Total Courses</h3>
                  <div className="stat-number">{branchStatistics.totalClassGroups || 0}</div>
                  <div className="stat-description">Active class groups</div>
                </div>
              </div>
              
              <div className="stat-card elegant warning">
                <div className="stat-icon">
                  <i className="fas fa-chart-bar"></i>
                </div>
                <div className="stat-content">
                  <h3>Avg Students/Branch</h3>
                  <div className="stat-number">{branchStatistics.averageStudentsPerBranch || 0}</div>
                  <div className="stat-description">Average enrollment</div>
                </div>
              </div>
            </div>
            
            {/* Most and Least Populated Branches */}
            {branchStatistics.mostPopulated && branchStatistics.leastPopulated && (
              <div className="branch-highlights">
                <div className="highlight-card most-populated">
                  <div className="highlight-header">
                    <i className="fas fa-trophy"></i>
                    <h4>Most Populated Branch</h4>
                  </div>
                  <div className="highlight-content">
                    <div className="branch-name">{branchStatistics.mostPopulated.name}</div>
                    <div className="branch-stats">
                      {branchStatistics.mostPopulated.totalStudents} students • {branchStatistics.mostPopulated.totalClassGroups} courses
                    </div>
                  </div>
                </div>
                
                <div className="highlight-card least-populated">
                  <div className="highlight-header">
                    <i className="fas fa-seedling"></i>
                    <h4>Growing Branch</h4>
                  </div>
                  <div className="highlight-content">
                    <div className="branch-name">{branchStatistics.leastPopulated.name}</div>
                    <div className="branch-stats">
                      {branchStatistics.leastPopulated.totalStudents} students • {branchStatistics.leastPopulated.totalClassGroups} courses
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Individual Branch Details using REAL DATA */}
          <div className="elegant-section">
            <h2 className="section-title">📚 REAL Branch Information (Same as Class Group Page)</h2>
            <div className="data-source-info">
              <div className="info-banner">
                <i className="fas fa-check-circle"></i>
                <span>This data is synchronized with the Class Group Management page and uses the same API endpoints</span>
              </div>
            </div>
            <div className="branch-cards-grid">
              {branchesData.length === 0 ? (
                <div className="no-data-message elegant">
                  <i className="fas fa-info-circle"></i>
                  <p>No branch data available from API</p>
                  <p>This could mean:</p>
                  <ul>
                    <li>No branches have been created yet</li>
                    <li>API connection issue</li>
                    <li>Permissions problem</li>
                  </ul>
                </div>
              ) : (
                branchesData.map((branch, index) => (
                  <div key={branch.id} className="branch-card elegant real-data">
                    <div className="branch-header">
                      <div className="branch-title">
                        <h3>{branch.name}</h3>
                        <div className="branch-rank">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>
                      </div>
                      <p className="branch-description">{branch.description}</p>
                      <div className="data-freshness">
                        <i className="fas fa-sync-alt"></i>
                        <span>Real-time data from API</span>
                      </div>
                    </div>
                    
                    {/* Main Statistics from REAL data */}
                    <div className="branch-main-stats">
                      <div className="main-stat">
                        <div className="stat-number">{branch.totalStudents}</div>
                        <div className="stat-label">Students</div>
                      </div>
                      <div className="main-stat">
                        <div className="stat-number">{branch.totalClassGroups}</div>
                        <div className="stat-label">Courses</div>
                      </div>
                      <div className="main-stat">
                        <div className="stat-number">{branch.averageStudentsPerClass}</div>
                        <div className="stat-label">Avg/Class</div>
                      </div>
                    </div>
                    
                    {/* Student Demographics from REAL data */}
                    <div className="branch-demographics">
                      <h4>👥 Student Demographics (Real Data)</h4>
                      <div className="demographic-item">
                        <span className="demo-label">Active Students:</span>
                        <span className="demo-value">{branch.activeStudents} / {branch.totalStudents}</span>
                      </div>
                      {branch.studentsByGender && (
                        <div className="demographic-breakdown">
                          <div className="gender-stats">
                            <div className="gender-item">
                              <span>👨 Male: {branch.studentsByGender.male}</span>
                            </div>
                            <div className="gender-item">
                              <span>👩 Female: {branch.studentsByGender.female}</span>
                            </div>
                            {branch.studentsByGender.other > 0 && (
                              <div className="gender-item">
                                <span>🤝 Other: {branch.studentsByGender.other}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Students by Year from REAL data */}
                    {branch.studentsByYear && branch.studentsByYear.length > 0 && (
                      <div className="branch-year-distribution">
                        <h4>📅 Students by Enrollment Year (Real Data)</h4>
                        <div className="year-bars">
                          {branch.studentsByYear.map(yearData => (
                            <div key={yearData.year} className="year-bar">
                              <div className="year-label">{yearData.year}</div>
                              <div className="year-count">{yearData.count}</div>
                              <div 
                                className="year-progress"
                                style={{
                                  width: `${branch.totalStudents > 0 ? (yearData.count / branch.totalStudents) * 100 : 0}%`
                                }}
                              ></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Course Distribution from REAL data */}
                    <div className="branch-courses">
                      <h4>📚 Course Distribution (Real Data)</h4>
                      <div className="course-stats">
                        <div className="course-item">
                          <span>📊 Total Courses:</span>
                          <span>{branch.totalCourses}</span>
                        </div>
                        <div className="course-item">
                          <span>✅ Active:</span>
                          <span>{branch.activeCourses}</span>
                        </div>
                      </div>
                      
                      {branch.classGroupsBySemester && branch.classGroupsBySemester.length > 0 && (
                        <div className="semester-breakdown">
                          <h5>By Semester:</h5>
                          {branch.classGroupsBySemester.map(semesterData => (
                            <div key={semesterData.semester} className="semester-item">
                              <span>{semesterData.semester}:</span>
                              <span>{semesterData.count} courses</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Recent Activity from REAL data */}
                    <div className="branch-recent-activity">
                      <h4>🔄 Recent Activity (Real Data)</h4>
                      {branch.recentEnrollments && branch.recentEnrollments.length > 0 ? (
                        <div className="recent-enrollments">
                          <h5>New Students (Last Month):</h5>
                          <div className="enrollment-list">
                            {branch.recentEnrollments.slice(0, 3).map(student => (
                              <div key={student.id} className="enrollment-item">
                                <span>👤 {student.firstName} {student.lastName}</span>
                                <span className="enrollment-date">
                                  {new Date(student.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="no-recent-activity">No recent enrollments</p>
                      )}
                    </div>
                    
                    {/* Current Classes from REAL data */}
                    {branch.upcomingClasses && branch.upcomingClasses.length > 0 && (
                      <div className="branch-upcoming">
                        <h4>📅 Current Courses (Real Data)</h4>
                        <div className="upcoming-list">
                          {branch.upcomingClasses.map(course => (
                            <div key={course.courseCode} className="upcoming-course">
                              <div className="course-code">{course.courseCode}</div>
                              <div className="course-name">{course.name}</div>
                              <div className="course-semester">{course.semester} {course.academicYear}</div>
                              {course.professorName && (
                                <div className="course-professor">👨‍🏫 {course.professorName}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Live Room Occupancy */}
      {selectedView === 'occupancy' && (
        <div className="elegant-section">
          <h2 className="section-title">🔴 Real-Time Room Status</h2>
          <div className="occupancy-grid elegant">
            {roomOccupancy.length === 0 ? (
              <div className="no-data-message elegant">
                <i className="fas fa-info-circle"></i>
                <p>No occupancy data available</p>
              </div>
            ) : (
              roomOccupancy.map((room, index) => (
                <div key={index} className={`occupancy-card elegant ${room.isOccupied ? 'occupied' : 'available'}`}>
                  <div className="room-name">
                    <h3>{room.roomName}</h3>
                    <span className={`status-indicator ${room.isOccupied ? 'occupied' : 'available'}`}>
                      {room.isOccupied ? '🔴 Occupied' : '🟢 Available'}
                    </span>
                  </div>
                  
                  {room.isOccupied && room.currentReservation && (
                    <div className="current-occupancy">
                      <h4>Current Occupant:</h4>
                      <div className="occupant-info">
                        <div>👤 {room.currentReservation.user}</div>
                        <div>🎭 {room.currentReservation.role}</div>
                        <div>⏰ {room.currentReservation.startTime} - {room.currentReservation.endTime}</div>
                        {room.currentReservation.purpose && (
                          <div>📝 {room.currentReservation.purpose}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {room.nextReservation && (
                    <div className="next-booking">
                      <h4>Next Booking:</h4>
                      <div className="next-info">
                        <div>👤 {room.nextReservation.user}</div>
                        <div>📅 {room.nextReservation.date}</div>
                        <div>⏰ {room.nextReservation.time}</div>
                        {room.nextReservation.purpose && (
                          <div>📝 {room.nextReservation.purpose}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="today-summary">
                    <div className="summary-item">
                      <span>📊 Today's Bookings:</span>
                      <span>{room.todayReservations}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* All Reservations */}
      {selectedView === 'reservations' && (
        <div className="elegant-section">
          <h2 className="section-title">📅 Complete Reservation History</h2>
          
          {/* Recent Reservations */}
          <div className="subsection">
            <h3>Recent Reservations</h3>
            <div className="elegant-table-container">
              <table className="elegant-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Room</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Date & Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReservations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No recent reservations</td>
                    </tr>
                  ) : (
                    recentReservations.map((reservation, index) => (
                      <tr key={index}>
                        <td><strong>{reservation.id}</strong></td>
                        <td>🏢 {reservation.classroom}</td>
                        <td>👤 {reservation.reservedBy}</td>
                        <td>
                          <span className={`role-badge table ${reservation.role?.toLowerCase()}`}>
                            {reservation.role}
                          </span>
                        </td>
                        <td>
                          <div>📅 {reservation.date}</div>
                          <div>⏰ {reservation.time}</div>
                        </td>
                        <td>{reservation.purpose || '-'}</td>
                        <td>
                          <span className={`status-badge ${reservation.status?.toLowerCase()}`}>
                            {reservation.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pending Demands */}
          <div className="subsection">
            <h3>Pending Approval Requests</h3>
            <div className="elegant-table-container">
              <table className="elegant-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Room</th>
                    <th>Requested By</th>
                    <th>Role</th>
                    <th>Date & Time</th>
                    <th>Purpose</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDemands.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">No pending requests</td>
                    </tr>
                  ) : (
                    pendingDemands.map((demand, index) => (
                      <tr key={index} className="pending-row">
                        <td><strong>{demand.id}</strong></td>
                        <td>🏢 {demand.classroom}</td>
                        <td>👤 {demand.reservedBy || demand.requestedBy}</td>
                        <td>
                          <span className={`role-badge table ${demand.role?.toLowerCase()}`}>
                            {demand.role}
                          </span>
                        </td>
                        <td>
                          <div>📅 {demand.date}</div>
                          <div>⏰ {demand.time}</div>
                        </td>
                        <td>{demand.purpose || '-'}</td>
                        <td>
                          <span className="priority-badge normal">
                            ⏳ Normal
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .export-info {
          margin-bottom: 1.5rem;
        }

        .info-banner.export-banner {
          background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%);
          color: #155724;
          border-left-color: #28a745;
        }

        .info-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          color: #155724;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #28a745;
          font-weight: 500;
        }

        .info-banner i {
          font-size: 1.2rem;
        }

        .branch-card.real-data {
          border: 2px solid #28a745;
          position: relative;
        }

        .branch-card.real-data::before {
          content: "REAL DATA";
          position: absolute;
          top: -12px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .data-freshness {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(40, 167, 69, 0.1);
          color: #28a745;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.85rem;
          margin-top: 0.75rem;
        }

        .data-freshness i {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .course-professor {
          color: #6c757d;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        .elegant-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2.5rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .header-content h1 {
          font-size: 2.2rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .header-subtitle {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 1rem;
        }

        .last-updated-info {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-size: 0.9rem;
          display: inline-block;
        }

        .header-controls {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }

        .btn-elegant {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-elegant.refresh {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .btn-elegant.regenerate {
          background: rgba(255, 255, 255, 0.3);
          color: white;
        }

        .btn-elegant.export-excel {
          background: rgba(34, 139, 34, 0.9);
          color: white;
        }

        .btn-elegant.export-pdf {
          background: rgba(220, 20, 60, 0.9);
          color: white;
        }

        .btn-elegant:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-elegant:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .elegant-alert {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .elegant-alert.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .elegant-alert.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .elegant-alert.info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .btn-close-alert {
          background: transparent;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .btn-close-alert:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .btn-retry {
          background: #dc3545;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        }

        .elegant-nav {
          display: flex;
          background: white;
          border-radius: 12px;
          padding: 0.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          overflow-x: auto;
        }

        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }

        .nav-item:hover {
          background: #f8f9fa;
        }

        .nav-item.active {
          background: #007bff;
          color: white;
        }

        .nav-item i {
          font-size: 1.2rem;
        }

        .nav-item span {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .elegant-section {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .section-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 2rem;
          border-bottom: 3px solid #3498db;
          padding-bottom: 0.5rem;
        }

        .stats-grid.elegant {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .stat-card.elegant {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          border-radius: 12px;
          transition: all 0.3s ease;
          border: 1px solid #e9ecef;
        }

        .stat-card.elegant:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .stat-card.elegant.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .stat-card.elegant.success {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          color: white;
        }

        .stat-card.elegant.warning {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .stat-card.elegant.info {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          color: white;
        }

        .stat-card.elegant.secondary {
          background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
          color: #2c3e50;
        }

        .stat-icon {
          font-size: 2.5rem;
          opacity: 0.9;
        }

        .stat-content h3 {
          font-size: 1rem;
          margin-bottom: 0.5rem;
          opacity: 0.9;
        }

        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .stat-description {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        /* Branch-specific styles */
        .branch-highlights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-top: 2rem;
        }

        .highlight-card {
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }

        .highlight-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .highlight-card.most-populated {
          background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
          border-color: #fdcb6e;
        }

        .highlight-card.least-populated {
          background: linear-gradient(135deg, #81ecec 0%, #74b9ff 100%);
          border-color: #00b894;
        }

        .highlight-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .highlight-header i {
          font-size: 1.5rem;
          color: #2c3e50;
        }

        .highlight-header h4 {
          color: #2c3e50;
          margin: 0;
        }

        .branch-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .branch-stats {
          color: #555;
          font-size: 0.95rem;
        }

        .branch-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .branch-card.elegant {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .branch-card.elegant:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }

        .branch-header {
          margin-bottom: 1.5rem;
        }

        .branch-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .branch-title h3 {
          color: #2c3e50;
          font-size: 1.4rem;
          margin: 0;
        }

        .branch-rank {
          font-size: 1.5rem;
        }

        .branch-description {
          color: #6c757d;
          font-style: italic;
          margin: 0;
        }

        .branch-main-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .main-stat {
          text-align: center;
        }

        .main-stat .stat-number {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .main-stat .stat-label {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: 500;
        }

        .branch-demographics, .branch-year-distribution, .branch-courses, 
        .branch-recent-activity, .branch-upcoming {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e9ecef;
        }

        .branch-demographics h4, .branch-year-distribution h4, 
        .branch-courses h4, .branch-recent-activity h4, .branch-upcoming h4 {
          color: #2c3e50;
          font-size: 1rem;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .demographic-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .demo-label {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .demo-value {
          font-weight: 600;
          color: #2c3e50;
        }

        .demographic-breakdown {
          margin-top: 0.75rem;
        }

        .gender-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 0.5rem;
        }

        .gender-item {
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 6px;
          text-align: center;
          font-size: 0.85rem;
          color: #495057;
        }

        .year-bars {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .year-bar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          background: #f8f9fa;
          border-radius: 6px;
          padding: 0.5rem;
        }

        .year-label {
          font-weight: 600;
          color: #2c3e50;
          min-width: 60px;
        }

        .year-count {
          font-weight: 600;
          color: #495057;
          min-width: 30px;
        }

        .year-progress {
          height: 6px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .course-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .course-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .semester-breakdown h5 {
          color: #495057;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .semester-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0;
          font-size: 0.85rem;
          color: #6c757d;
        }

        .recent-enrollments h5 {
          color: #495057;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .enrollment-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .enrollment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fa;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.85rem;
        }

        .enrollment-date {
          color: #6c757d;
          font-size: 0.8rem;
        }

        .no-recent-activity {
          color: #6c757d;
          font-style: italic;
          font-size: 0.9rem;
          margin: 0;
        }

        .upcoming-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .upcoming-course {
          background: #f8f9fa;
          padding: 0.75rem;
          border-radius: 6px;
          border-left: 4px solid #667eea;
        }

        .course-code {
          font-weight: 700;
          color: #2c3e50;
          font-size: 0.9rem;
        }

        .course-name {
          color: #495057;
          font-size: 0.85rem;
          margin: 0.25rem 0;
        }

        .course-semester {
          color: #6c757d;
          font-size: 0.8rem;
        }

        .room-cards-grid, .user-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
        }

        .room-card.elegant, .user-card.elegant {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .room-card.elegant:hover, .user-card.elegant:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .room-header, .user-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f8f9fa;
        }

        .room-header h3, .user-header h3 {
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .status.occupied {
          background: #f8d7da;
          color: #721c24;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status.available {
          background: #d4edda;
          color: #155724;
          padding: 0.25rem 0.75rem;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .room-stats, .user-stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
        }

        .stat-item .label {
          color: #6c757d;
          font-size: 0.9rem;
        }

        .stat-item .value {
          font-weight: 600;
          color: #2c3e50;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .role-badge.professor {
          background: #d4edda;
          color: #155724;
        }

        .role-badge.student {
          background: #d1ecf1;
          color: #0c5460;
        }

        .role-badge.admin {
          background: #f8d7da;
          color: #721c24;
        }

        .current-booking, .role-breakdown, .recent-bookings, .booking-status-breakdown, .recent-user-bookings {
          margin-bottom: 1.5rem;
        }

        .current-booking h4, .role-breakdown h4, .recent-bookings h4, .booking-status-breakdown h4, .recent-user-bookings h4 {
          color: #2c3e50;
          font-size: 1rem;
          margin-bottom: 0.75rem;
        }

        .booking-info, .role-stats, .status-stats {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
        }

        .role-item, .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .status-item.approved {
          color: #155724;
        }

        .status-item.pending {
          color: #856404;
        }

        .status-item.cancelled {
          color: #721c24;
        }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .booking-item {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #007bff;
        }

        .booking-user, .booking-room {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }

        .booking-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #6c757d;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .booking-purpose {
          color: #6c757d;
          font-style: italic;
          font-size: 0.85rem;
        }

        .status-badge {
          padding: 0.2rem 0.6rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-badge.approved {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.cancelled {
          background: #f8d7da;
          color: #721c24;
        }

        .occupancy-grid.elegant {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .occupancy-card.elegant {
          border-radius: 12px;
          padding: 1.5rem;
          border: 2px solid;
          transition: all 0.3s ease;
        }

        .occupancy-card.elegant.occupied {
          border-color: #dc3545;
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        }

        .occupancy-card.elegant.available {
          border-color: #28a745;
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        }

        .occupancy-card.elegant:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .room-name {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .status-indicator {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .status-indicator.occupied {
          background: rgba(220, 53, 69, 0.2);
          color: #721c24;
        }

        .status-indicator.available {
          background: rgba(40, 167, 69, 0.2);
          color: #155724;
        }

        .current-occupancy, .next-booking, .today-summary {
          margin-bottom: 1rem;
        }

        .current-occupancy h4, .next-booking h4 {
          color: #2c3e50;
          margin-bottom: 0.75rem;
        }

        .occupant-info, .next-info {
          background: rgba(255, 255, 255, 0.7);
          padding: 1rem;
          border-radius: 8px;
        }

        .occupant-info div, .next-info div {
          margin-bottom: 0.5rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.7);
          padding: 0.75rem;
          border-radius: 8px;
        }

        .user-rank {
          font-size: 2rem;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .subsection {
          margin-bottom: 3rem;
        }

        .subsection h3 {
          color: #2c3e50;
          font-size: 1.3rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e9ecef;
        }

        .elegant-table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .elegant-table {
          width: 100%;
          border-collapse: collapse;
        }

        .elegant-table th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.25rem 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .elegant-table td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid #e9ecef;
          vertical-align: top;
        }

        .elegant-table tbody tr:hover {
          background: #f8f9fa;
        }

        .elegant-table tbody tr.pending-row {
          background: #fff3cd;
        }

        .elegant-table tbody tr.pending-row:hover {
          background: #ffeaa7;
        }

        .role-badge.table {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .priority-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .priority-badge.normal {
          background: #d1ecf1;
          color: #0c5460;
        }

        .no-data {
          text-align: center;
          color: #6c757d;
          font-style: italic;
          padding: 2rem;
        }

        .no-data-message.elegant {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }

        .no-data-message.elegant i {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-data-message.elegant ul {
          text-align: left;
          max-width: 300px;
          margin: 1rem auto;
        }

        @media (max-width: 768px) {
          .elegant-header {
            padding: 1.5rem;
          }

          .header-content h1 {
            font-size: 1.8rem;
          }

          .header-controls {
            flex-direction: column;
            gap: 0.5rem;
          }

          .btn-elegant {
            width: 100%;
            justify-content: center;
          }

          .elegant-nav {
            flex-direction: column;
          }

          .nav-item {
            flex-direction: row;
            justify-content: center;
            min-width: auto;
          }

          .stats-grid.elegant {
            grid-template-columns: 1fr;
          }

          .room-cards-grid, .user-cards-grid, .branch-cards-grid {
            grid-template-columns: 1fr;
          }

          .occupancy-grid.elegant {
            grid-template-columns: 1fr;
          }

          .booking-details {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .branch-highlights {
            grid-template-columns: 1fr;
          }

          .branch-main-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .gender-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminReports;