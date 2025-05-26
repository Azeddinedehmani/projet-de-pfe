import API from '../api';

/**
 * Shared service for dashboard and reports data
 * Ensures consistency across all admin pages
 */
class SharedDashboardService {
  constructor() {
    this.cacheExpiryTime = 30000; // 30 seconds cache validity
    this.dataCache = {
      dashboardData: { data: null, timestamp: 0 }
    };
  }

  /**
   * Check if cache is valid
   */
  isCacheValid() {
    const cache = this.dataCache.dashboardData;
    if (!cache || !cache.data) return false;
    
    const now = Date.now();
    return (now - cache.timestamp) < this.cacheExpiryTime;
  }

  /**
   * Fetch all dashboard data - SAME AS DASHBOARD COMPONENT
   * This ensures consistency between Dashboard and Reports pages
   */
  async fetchDashboardData(forceRefresh = false) {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && this.isCacheValid()) {
      console.log('Using cached dashboard data');
      return this.dataCache.dashboardData.data;
    }

    console.log('Fetching fresh dashboard data...');
    
    const results = {
      stats: {
        totalClassrooms: 0,
        activeReservations: 0,
        pendingDemands: 0,
        totalUsers: 0,
        totalClassGroups: 0,
        classroomDetails: '',
        userDetails: '',
        isLoading: false
      },
      recentReservations: [],
      pendingDemands: [],
      classrooms: [],
      users: [],
      error: null,
      lastUpdated: new Date()
    };
    
    try {
      // Fetch classrooms - SAME AS DASHBOARD
      let classroomCount = 0;
      let classroomBreakdown = '';
      let classroomsData = [];
      
      try {
        const classroomsResponse = await API.get('/api/rooms/classrooms');
        
        if (classroomsResponse && classroomsResponse.data) {
          classroomsData = classroomsResponse.data;
          classroomCount = classroomsData.length;
          
          // Count different types of classrooms
          const typeCounts = {};
          classroomsData.forEach(room => {
            const type = room.type || 'Other';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
          
          // Format breakdown text
          classroomBreakdown = Object.entries(typeCounts)
            .map(([type, count]) => `${count} ${type.toLowerCase()}`)
            .join(', ');
        }
      } catch (err) {
        console.error('Error fetching classrooms:', err);
        
        // Try alternative data source or localStorage as fallback
        const storedClassrooms = JSON.parse(localStorage.getItem('availableClassrooms') || '[]');
        classroomsData = storedClassrooms;
        classroomCount = storedClassrooms.length;
        
        // Count different types from stored data
        const typeCounts = {};
        storedClassrooms.forEach(room => {
          const type = room.type || 'Other';
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        classroomBreakdown = Object.entries(typeCounts)
          .map(([type, count]) => `${count} ${type.toLowerCase()}`)
          .join(', ');
      }
      
      // Fetch users - SAME AS DASHBOARD
      let userCount = 0;
      let userBreakdown = '';
      let usersData = [];
      let usersByRole = {
        adminCount: 0,
        professorCount: 0,
        studentCount: 0,
        otherCount: 0
      };
      
      try {
        const usersResponse = await API.get('/users');
        
        if (usersResponse && usersResponse.data) {
          usersData = usersResponse.data;
          userCount = usersData.length;
          
          // Count different roles
          const roleCounts = {};
          usersData.forEach(user => {
            const role = user.role ? user.role.toLowerCase() : 'unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
            
            // Update usersByRole for reports
            switch(role) {
              case 'admin':
                usersByRole.adminCount++;
                break;
              case 'professor':
                usersByRole.professorCount++;
                break;
              case 'student':
                usersByRole.studentCount++;
                break;
              default:
                usersByRole.otherCount++;
                break;
            }
          });
          
          // Format breakdown text
          userBreakdown = Object.entries(roleCounts)
            .map(([role, count]) => `${count} ${role}s`)
            .join(', ');
        }
      } catch (err) {
        console.error('Error fetching users:', err);
        userCount = 0;
        userBreakdown = 'Unable to load user details';
      }
      
      // Fetch reservations - SAME AS DASHBOARD
      let activeReservationCount = 0;
      let reservationData = [];
      
      try {
        // First try admin endpoint
        let response;
        try {
          response = await API.get('/api/admin/dashboard/recent-reservations');
        } catch (err) {
          console.log("Falling back to regular reservations endpoint");
          response = await API.get('/api/reservations');
        }
        
        if (response && response.data) {
          reservationData = response.data;
          
          // Count active reservations (approved status)
          activeReservationCount = reservationData.filter(
            res => res.status && res.status.toLowerCase() === 'approved'
          ).length;
          
          // Get most recent reservations (up to 3)
          const recent = reservationData
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 3);
            
          results.recentReservations = recent;
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        activeReservationCount = 0;
        results.recentReservations = [];
      }
      
      // Fetch pending demands - SAME AS DASHBOARD
      let pendingDemandsCount = 0;
      let demandsData = [];
      
      try {
        // Try admin endpoint first, fall back to regular endpoint
        let response;
        try {
          response = await API.get('/api/admin/dashboard/pending-demands');
        } catch (err) {
          console.log("Falling back to reservations/pending endpoint");
          response = await API.get('/api/reservations/pending');
        }
        
        if (response && response.data) {
          demandsData = response.data;
          pendingDemandsCount = demandsData.length;
          
          // Set up to 3 pending demands for display
          results.pendingDemands = demandsData.slice(0, 3);
        }
      } catch (err) {
        console.error('Error fetching demands:', err);
        pendingDemandsCount = 0;
        results.pendingDemands = [];
      }
      
      // Fetch class groups - SAME AS DASHBOARD
      let classGroupCount = 0;
      
      try {
        const classGroupsResponse = await API.get('/api/class-groups');
        
        if (classGroupsResponse && classGroupsResponse.data) {
          classGroupCount = classGroupsResponse.data.length;
        }
      } catch (err) {
        console.error('Error fetching class groups:', err);
        classGroupCount = 0;
      }
      
      // Update stats with all collected data
      results.stats = {
        totalClassrooms: classroomCount,
        activeReservations: activeReservationCount,
        pendingDemands: pendingDemandsCount,
        totalUsers: userCount,
        totalClassGroups: classGroupCount,
        classroomDetails: classroomBreakdown || 'No details available',
        userDetails: userBreakdown || 'No details available',
        isLoading: false,
        // Additional stats for reports
        approvedReservations: activeReservationCount,
        pendingReservations: pendingDemandsCount,
        rejectedReservations: 0, // Would need additional API call
        professorReservations: reservationData.filter(r => r.role?.toLowerCase() === 'professor').length,
        studentReservations: reservationData.filter(r => r.role?.toLowerCase() === 'student').length,
        totalStudyRooms: classroomsData.filter(room => room.type?.toLowerCase().includes('study')).length,
        usersByRole
      };
      
      // Add raw data for reports processing
      results.allReservations = reservationData;
      results.classrooms = classroomsData;
      results.users = usersData;
      
      // Calculate popular rooms from reservation data
      results.popularRooms = this.calculatePopularRooms(reservationData);
      
      // Calculate most active users
      results.mostActiveUsers = this.calculateMostActiveUsers(reservationData);
      
      // Calculate monthly activity
      results.monthlyActivity = this.calculateMonthlyActivity(reservationData);
      
      // Update cache
      this.dataCache.dashboardData = {
        data: results,
        timestamp: Date.now()
      };
      
      return results;
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      results.error = 'Failed to load dashboard data. Please try again.';
      results.stats.isLoading = false;
      return results;
    }
  }

  /**
   * Calculate popular rooms from reservation data
   */
  calculatePopularRooms(reservations) {
    const roomCounts = {};
    const roomRoleCounts = {};
    
    reservations.forEach(reservation => {
      const room = reservation.classroom || reservation.room || 'Unknown';
      const role = reservation.role?.toLowerCase() || 'unknown';
      
      // Count total reservations per room
      roomCounts[room] = (roomCounts[room] || 0) + 1;
      
      // Count by role per room
      if (!roomRoleCounts[room]) {
        roomRoleCounts[room] = { professor: 0, student: 0, admin: 0, unknown: 0 };
      }
      roomRoleCounts[room][role] = (roomRoleCounts[room][role] || 0) + 1;
    });
    
    // Convert to array and sort by count
    const totalReservations = reservations.length;
    const popularRooms = Object.entries(roomCounts)
      .map(([room, count]) => ({
        room,
        count,
        percentage: totalReservations > 0 ? (count / totalReservations) * 100 : 0,
        roleData: roomRoleCounts[room] || { professor: 0, student: 0, admin: 0, unknown: 0 }
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 rooms
    
    return popularRooms;
  }

  /**
   * Calculate most active users from reservation data
   */
  calculateMostActiveUsers(reservations) {
    const userCounts = {};
    
    reservations.forEach(reservation => {
      const userName = reservation.reservedBy || reservation.requestedBy || 'Unknown';
      const role = reservation.role || 'Unknown';
      const key = `${userName}_${role}`;
      
      if (!userCounts[key]) {
        userCounts[key] = {
          userName,
          role,
          count: 0
        };
      }
      userCounts[key].count++;
    });
    
    // Convert to array and sort by count
    const activeUsers = Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 users
    
    return activeUsers;
  }

  /**
   * Calculate monthly activity from reservation data
   */
  calculateMonthlyActivity(reservations) {
    const monthlyData = {};
    
    reservations.forEach(reservation => {
      // Parse date - handle different date formats
      let date;
      if (reservation.date) {
        date = new Date(reservation.date);
      } else if (reservation.createdAt) {
        date = new Date(reservation.createdAt);
      } else {
        return; // Skip if no date
      }
      
      if (isNaN(date.getTime())) return; // Skip invalid dates
      
      const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      const role = reservation.role?.toLowerCase() || 'unknown';
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          professorCount: 0,
          studentCount: 0,
          adminCount: 0,
          total: 0
        };
      }
      
      switch(role) {
        case 'professor':
          monthlyData[monthKey].professorCount++;
          break;
        case 'student':
          monthlyData[monthKey].studentCount++;
          break;
        case 'admin':
          monthlyData[monthKey].adminCount++;
          break;
      }
      monthlyData[monthKey].total++;
    });
    
    // Convert to array and sort by date
    const monthlyActivity = Object.values(monthlyData)
      .sort((a, b) => new Date(a.month) - new Date(b.month));
    
    return monthlyActivity;
  }

  /**
   * Get dashboard stats only (for quick updates)
   */
  async getStats(forceRefresh = false) {
    const data = await this.fetchDashboardData(forceRefresh);
    return data.stats;
  }

  /**
   * Get reports data (formatted for reports page)
   */
  async getReportsData(forceRefresh = false) {
    const data = await this.fetchDashboardData(forceRefresh);
    
    return {
      statistics: data.stats,
      popularRooms: data.popularRooms || [],
      activeUsers: data.mostActiveUsers || [],
      monthlyActivity: data.monthlyActivity || [],
      allReservations: data.allReservations || [],
      classrooms: data.classrooms || [],
      users: data.users || []
    };
  }

  /**
   * Invalidate cache to force refresh
   */
  invalidateCache() {
    this.dataCache.dashboardData.timestamp = 0;
  }

  /**
   * Export CSV using the same data
   */
  async exportCsv() {
    const data = await this.fetchDashboardData(true);
    const reservations = data.allReservations || [];
    
    // Create CSV content
    const headers = ['ID', 'Classroom', 'Reserved By', 'Role', 'Date', 'Time', 'Status', 'Purpose', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...reservations.map(reservation => [
        reservation.id || '',
        reservation.classroom || reservation.room || '',
        reservation.reservedBy || reservation.requestedBy || '',
        reservation.role || '',
        reservation.date || '',
        reservation.time || '',
        reservation.status || '',
        reservation.purpose || '',
        reservation.createdAt || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    // Return as blob
    return {
      data: new Blob([csvContent], { type: 'text/csv' })
    };
  }

  /**
   * Get PDF data using the same data
   */
  async getPdfData() {
    const data = await this.getReportsData(true);
    
    return {
      data: {
        statistics: data.statistics,
        popularRooms: data.popularRooms,
        activeUsers: data.activeUsers,
        monthlyActivity: data.monthlyActivity,
        generatedAt: new Date().toISOString(),
        title: 'Campus Room Booking System Report'
      }
    };
  }
}

// Export singleton instance
export default new SharedDashboardService();