// src/services/SettingsService.js
import API from '../api';

/**
 * Service for managing application settings
 * This service centralizes access to system settings across the application
 */
class SettingsService {
  /**
   * Cache for system settings
   * @private
   */
  _settingsCache = null;

  /**
   * Timestamp when settings were last fetched
   * @private
   */
  _lastFetched = null;

  /**
   * Subscriptions to settings changes
   * @private
   */
  _subscribers = [];

  /**
   * WebSocket connection for real-time updates
   * @private
   */
  _stompClient = null;

  /**
   * Constructor - Initialize WebSocket connection
   */
  constructor() {
    this.initializeWebSocket();
  }

  /**
   * Initialize WebSocket connection for real-time settings updates
   */
  initializeWebSocket() {
    if (typeof window !== 'undefined') {
      try {
        // Note: You'll need to include SockJS and Stomp libraries
        // Add these to your index.html:
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.6.1/sockjs.min.js"></script>
        // <script src="https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js"></script>
        
        if (window.SockJS && window.Stomp) {
          const socket = new window.SockJS('/ws');
          this._stompClient = window.Stomp.over(socket);
          
          this._stompClient.connect({}, () => {
            console.log('Connected to WebSocket for settings updates');
            this._stompClient.subscribe('/topic/settings', (message) => {
              try {
                const updatedSettings = JSON.parse(message.body);
                console.log('Received settings update via WebSocket:', updatedSettings);
                this._updateCache(updatedSettings);
              } catch (error) {
                console.error('Error processing WebSocket settings update:', error);
              }
            });
          }, (error) => {
            console.warn('WebSocket connection failed, falling back to polling:', error);
          });
        }
      } catch (error) {
        console.warn('WebSocket initialization failed:', error);
      }
    }
  }

  /**
   * Update cache and notify subscribers
   * @private
   */
  _updateCache(settings) {
    this._settingsCache = settings;
    this._lastFetched = Date.now();
    
    // Save to localStorage for offline access
    localStorage.setItem('systemSettings', JSON.stringify(settings));
    
    // Notify subscribers
    this._notifySubscribers(settings);
  }

  /**
   * Force refresh the settings from the backend
   * @returns {Promise<Object>} The system settings
   */
  async refreshSettings() {
    try {
      console.log('Refreshing settings from backend...');
      const response = await API.get('/settings');
      const settings = response.data;
      
      // Update cache
      this._updateCache(settings);
      
      return settings;
    } catch (error) {
      console.error('Error refreshing settings:', error);
      
      // Try to get from localStorage as fallback
      const cachedSettings = localStorage.getItem('systemSettings');
      if (cachedSettings) {
        try {
          const parsedSettings = JSON.parse(cachedSettings);
          console.log('Using cached settings from localStorage');
          return parsedSettings;
        } catch (parseError) {
          console.error('Error parsing cached settings:', parseError);
        }
      }
      
      // If all else fails, return default settings
      return this._getDefaultSettings();
    }
  }

  /**
   * Get the system settings, using cache if available and recent
   * @param {boolean} [forceRefresh=false] Whether to force a refresh from the server
   * @returns {Promise<Object>} The system settings
   */
  async getSettings(forceRefresh = false) {
    // If we have cached settings and they're recent (less than 5 minutes old)
    const cacheDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isCacheValid = this._settingsCache && 
                        this._lastFetched && 
                        (Date.now() - this._lastFetched < cacheDuration);
    
    if (!forceRefresh && isCacheValid) {
      return this._settingsCache;
    }
    
    return this.refreshSettings();
  }

  /**
   * Update the system settings
   * @param {Object} updatedSettings The settings to update
   * @returns {Promise<Object>} The updated settings
   */
  async updateSettings(updatedSettings) {
    try {
      console.log('Updating settings:', updatedSettings);
      const response = await API.put('/settings', updatedSettings);
      const settings = response.data;
      
      // Update cache
      this._updateCache(settings);
      
      return settings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Get specific setting value with fallback
   * @param {string} key The setting key
   * @param {*} defaultValue Default value if setting not found
   * @returns {*} Setting value or default
   */
  getSetting(key, defaultValue = null) {
    if (!this._settingsCache) {
      return defaultValue;
    }
    return this._settingsCache[key] !== undefined ? this._settingsCache[key] : defaultValue;
  }

  /**
   * Check if settings are ready (loaded)
   * @returns {boolean} Whether settings are loaded
   */
  isReady() {
    return this._settingsCache !== null;
  }

  /**
   * Subscribe to settings changes
   * @param {Function} callback Function to call when settings change
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    
    this._subscribers.push(callback);
    console.log(`Settings subscriber added. Total subscribers: ${this._subscribers.length}`);
    
    // Return unsubscribe function
    return () => {
      this._subscribers = this._subscribers.filter(cb => cb !== callback);
      console.log(`Settings subscriber removed. Total subscribers: ${this._subscribers.length}`);
    };
  }

  /**
   * Notify subscribers of settings changes
   * @private
   * @param {Object} settings The updated settings
   */
  _notifySubscribers(settings) {
    console.log(`Notifying ${this._subscribers.length} settings subscribers`);
    this._subscribers.forEach((callback, index) => {
      try {
        callback(settings);
      } catch (error) {
        console.error(`Error in settings subscriber ${index}:`, error);
      }
    });
  }

  /**
   * Get default settings if none are available
   * @private
   * @returns {Object} Default settings
   */
  _getDefaultSettings() {
    return {
      systemName: 'Campus Room',
      tagline: 'Smart Classroom Management System',
      contactEmail: 'admin@campusroom.edu',
      supportPhone: '(555) 123-4567',
      autoApproveAdmin: true,
      autoApproveProfessor: false,
      autoApproveStudent: false,
      emailNotifications: true,
      reservationCreated: true,
      reservationApproved: true,
      reservationRejected: true,
      newUserRegistered: true,
      systemUpdates: true,
      dailyDigest: false,
      maxDaysInAdvance: 30,
      minTimeBeforeReservation: 1,
      maxHoursPerReservation: 4,
      maxReservationsPerWeek: 5,
      studentRequireApproval: true,
      professorRequireApproval: false,
      showAvailabilityCalendar: true
    };
  }

  /**
   * Cleanup WebSocket connection
   */
  disconnect() {
    if (this._stompClient && this._stompClient.connected) {
      this._stompClient.disconnect();
      console.log('Disconnected from settings WebSocket');
    }
  }
}

// Create singleton instance
const settingsService = new SettingsService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    settingsService.disconnect();
  });
}

export default settingsService;