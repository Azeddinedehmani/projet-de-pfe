import API from '../api';
import ReservationEmailService from './ReservationEmailService';
import { generateId } from '../utils/helpers';

/**
 * Enhanced Service for handling report data operations
 * Improved for better compatibility with backend
 */
class ReportService {
  constructor() {
    // Setup event listeners for data changes from other components
    this.setupEventListeners();
    this.cacheExpiryTime = 5 * 60 * 1000; // 5 minutes cache validity
    this.dataCache = {
      dashboardStats: { data: null, timestamp: 0 },
      popularRooms: { data: null, timestamp: 0 },
      activeUsers: { data: null, timestamp: 0 },
      monthlyActivity: { data: null, timestamp: 0 },
      allReservations: { data: null, timestamp: 0 },
      usersByRole: { data: null, timestamp: 0 }
    };
  }

  /**
   * Setup event listeners to catch data updates from other components
   */
  setupEventListeners() {
    // Listen for reservation changes
    document.addEventListener('reservation-updated', this.handleReservationUpdate.bind(this));
    document.addEventListener('reservation-created', this.handleReservationUpdate.bind(this));
    document.addEventListener('reservation-cancelled', this.handleReservationUpdate.bind(this));
    
    // Listen for user changes
    document.addEventListener('user-created', this.handleUserUpdate.bind(this));
    document.addEventListener('user-updated', this.handleUserUpdate.bind(this));
    
    // Listen for room changes
    document.addEventListener('room-updated', this.handleRoomUpdate.bind(this));
    
    // Process queued emails when reports are accessed
    this.processQueuedEmails();
  }

  /**
   * Process any queued emails that couldn't be sent previously
   */
  async processQueuedEmails() {
    try {
      const result = await ReservationEmailService.processEmailQueue();
      if (result && result.success > 0) {
        console.log(`Processed ${result.success} queued emails when loading reports`);
      }
      return result;
    } catch (error) {
      console.error('Error processing email queue in ReportService:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Handle reservation update event from other components
   */
  handleReservationUpdate(event) {
    console.log('ReportService detected reservation update', event.detail);
    // Invalidate relevant caches
    this.invalidateCache('dashboardStats');
    this.invalidateCache('popularRooms');
    this.invalidateCache('monthlyActivity');
    this.invalidateCache('allReservations');
  }

  /**
   * Handle user update event from other components
   */
  handleUserUpdate(event) {
    console.log('ReportService detected user update', event.detail);
    // Invalidate relevant caches
    this.invalidateCache('dashboardStats');
    this.invalidateCache('activeUsers');
    this.invalidateCache('usersByRole');
  }

  /**
   * Handle room update event from other components
   */
  handleRoomUpdate(event) {
    console.log('ReportService detected room update', event.detail);
    // Invalidate relevant caches
    this.invalidateCache('dashboardStats');
    this.invalidateCache('popularRooms');
  }

  /**
   * Invalidate a specific cache
   */
  invalidateCache(cacheKey) {
    if (this.dataCache[cacheKey]) {
      this.dataCache[cacheKey].timestamp = 0;
    }
  }

  /**
   * Check if cache is valid for a specific key
   */
  isCacheValid(cacheKey) {
    const cache = this.dataCache[cacheKey];
    if (!cache || !cache.data) return false;
    
    const now = Date.now();
    return (now - cache.timestamp) < this.cacheExpiryTime;
  }

  /**
   * Update cache for a specific key
   */
  updateCache(cacheKey, data) {
    this.dataCache[cacheKey] = {
      data,
      timestamp: Date.now()
    };
  }

  /**
   * Fetch dashboard statistics with improved caching
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats(forceRefresh = false) {
    // Use cache if available and not forcing refresh
    if (!forceRefresh && this.isCacheValid('dashboardStats')) {
      console.log('Using cached dashboard stats');
      return this.dataCache.dashboardStats.data;
    }

    try {
      // Use the reportsAPI to get the data
      const response = await API.reportsAPI.getDashboardStats(forceRefresh);
      const stats = response.data;
      
      // Update cache
      this.updateCache('dashboardStats', stats);
      
      // Dispatch an event to notify components of data update
      this.dispatchDataUpdateEvent('stats-updated');
      
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Fetch full reports data for admin reports page
   * @param {boolean} forceRefresh - Force refresh from server
   * @returns {Promise<Object>} Complete reports data
   */
  async getReportsData(forceRefresh = false) {
    try {
      // Use the reportsAPI to get the data
      const response = await API.reportsAPI.getReportsData(forceRefresh);
      const reportData = response.data;
      
      // Ensure adminCount exists in monthlyActivity data
      if (reportData.monthlyActivity) {
        reportData.monthlyActivity = reportData.monthlyActivity.map(month => ({
          ...month,
          adminCount: month.adminCount !== undefined ? month.adminCount : 0
        }));
      }
      
      // Ensure role information in activeUsers data
      if (reportData.activeUsers) {
        reportData.activeUsers = reportData.activeUsers.map(user => ({
          ...user,
          userName: user.userName || "Unknown User",
          role: user.role || "Unknown Role"
        }));
      }
      
      // Ensure percentage in popularRooms data
      if (reportData.popularRooms) {
        reportData.popularRooms = reportData.popularRooms.map(room => ({
          ...room,
          percentage: room.percentage !== undefined ? room.percentage : 0,
          // Ensure roleData exists
          roleData: room.roleData || { professor: 0, student: 0, admin: 0, unknown: 0 }
        }));
      }
      
      // Update caches
      this.updateCache('dashboardStats', reportData.statistics);
      this.updateCache('popularRooms', reportData.popularRooms);
      this.updateCache('activeUsers', reportData.activeUsers);
      this.updateCache('monthlyActivity', reportData.monthlyActivity);
      
      // Notify components of data update
      this.dispatchDataUpdateEvent('reports-updated');
      
      return reportData;
    } catch (error) {
      console.error('Error fetching reports data:', error);
      throw error;
    }
  }

  /**
   * Generate CSV report of all reservations
   * @returns {Promise<string>} CSV content as string
   */
  async generateCSVReport() {
    try {
      // Use the reportsAPI to get CSV data
      const response = await API.reportsAPI.exportCsv();
      
      // Convert blob to text
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(response.data);
      });
      
      return text;
    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw error;
    }
  }
  
  /**
   * Generate Excel report with comprehensive data
   * @returns {Promise<Object>} Excel data object for client-side generation
   */
  async generateExcelData() {
    try {
      // Get data for Excel report
      const data = await this.getReportsData(true);
      
      // Format the data for Excel - with handling for null/undefined values
      return {
        statistics: data.statistics || {},
        popularRooms: data.popularRooms || [],
        activeUsers: data.activeUsers || [],
        monthlyActivity: data.monthlyActivity || [],
        usersByRole: data.usersByRole || {
          adminCount: 0,
          professorCount: 0,
          studentCount: 0,
          otherCount: 0,
          totalCount: 0
        },
        reservations: []  // This can be populated as needed
      };
    } catch (error) {
      console.error('Error generating Excel data:', error);
      throw error;
    }
  }
  
  /**
   * Generate PDF report with comprehensive data
   * @returns {Promise<Object>} PDF data object for client-side generation
   */
  async generatePDFData() {
    try {
      // Use the reportsAPI to get PDF data
      const response = await API.reportsAPI.getPdfData();
      const pdfData = response.data;
      
      return pdfData;
    } catch (error) {
      console.error('Error generating PDF data:', error);
      throw error;
    }
  }
  
  /**
   * Dispatch custom event to notify of data updates
   * @param {string} eventType - Type of update event
   */
  dispatchDataUpdateEvent(eventType) {
    const event = new CustomEvent(eventType, {
      detail: {
        timestamp: new Date().toISOString(),
        source: 'ReportService'
      }
    });
    
    document.dispatchEvent(event);
  }
}

// Export a singleton instance
export default new ReportService();