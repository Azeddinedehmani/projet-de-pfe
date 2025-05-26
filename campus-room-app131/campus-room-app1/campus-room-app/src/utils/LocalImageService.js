// src/utils/LocalImageService.js

/**
 * Service to manage images stored in the browser's localStorage
 * Now supports user-specific storage and cleanup
 */
const LocalImageService = {
  /**
   * Get an image from localStorage by its filename
   * @param {string} imageId - The unique ID/filename of the image
   * @returns {string|null} The data URL of the image or null if not found
   */
  getImage(imageId) {
    if (!imageId) return null;
    
    // Check if this is a local storage URL
    if (!imageId.startsWith('local-storage://')) {
      // This is a regular URL, return as is
      return imageId;
    }
    
    // Extract the filename from the URL
    const fileName = imageId.replace('local-storage://', '');
    
    try {
      // Get images from localStorage
      const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
      
      // Return the specific image
      return storedImages[fileName] || null;
    } catch (error) {
      console.error('Error retrieving image from localStorage:', error);
      return null;
    }
  },
  
  /**
   * Save an image to localStorage
   * @param {string} fileName - Unique identifier for the image
   * @param {string} dataUrl - The data URL of the image
   * @returns {string} The full URL to reference the image
   */
  saveImage(fileName, dataUrl) {
    try {
      // Get existing images or initialize empty object
      const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
      
      // Add new image
      storedImages[fileName] = dataUrl;
      
      // Save back to localStorage
      localStorage.setItem('classroomImages', JSON.stringify(storedImages));
      
      console.log(`Image ${fileName} saved to localStorage`);
      
      // Return the full URL to reference this image
      return `local-storage://${fileName}`;
    } catch (error) {
      console.error('Error saving image to localStorage:', error);
      // If localStorage is full, try to remove older images
      if (error.name === 'QuotaExceededError') {
        this.cleanupStorage();
        // Try again after cleanup
        return this.saveImage(fileName, dataUrl);
      }
      return null;
    }
  },
  
  /**
   * Save a user-specific image to localStorage
   * @param {string} userId - The user ID
   * @param {string} fileName - Unique identifier for the image
   * @param {string} dataUrl - The data URL of the image
   * @returns {string|null} The full URL to reference the image or null if failed
   */
  saveUserImage(userId, fileName, dataUrl) {
    try {
      // Get existing user images or initialize empty object
      const userImages = JSON.parse(localStorage.getItem(`userImages_${userId}`) || '{}');
      
      // Add new image with timestamp
      userImages[fileName] = {
        dataUrl: dataUrl,
        timestamp: Date.now(),
        userId: userId
      };
      
      // Save back to localStorage
      localStorage.setItem(`userImages_${userId}`, JSON.stringify(userImages));
      
      console.log(`User image ${fileName} saved to localStorage for user ${userId}`);
      
      // Return the full URL to reference this image
      return `local-storage-user://${userId}/${fileName}`;
    } catch (error) {
      console.error('Error saving user image to localStorage:', error);
      // If localStorage is full, try to cleanup old images
      if (error.name === 'QuotaExceededError') {
        this.cleanupUserImages(userId);
        // Try again after cleanup
        return this.saveUserImage(userId, fileName, dataUrl);
      }
      return null;
    }
  },
  
  /**
   * Get a user-specific image from localStorage
   * @param {string} userId - The user ID
   * @param {string} fileName - The image filename
   * @returns {string|null} The data URL of the image or null if not found
   */
  getUserImage(userId, fileName) {
    try {
      const userImages = JSON.parse(localStorage.getItem(`userImages_${userId}`) || '{}');
      const imageData = userImages[fileName];
      
      return imageData ? imageData.dataUrl : null;
    } catch (error) {
      console.error('Error retrieving user image from localStorage:', error);
      return null;
    }
  },
  
  /**
   * Enhanced getImage method that handles both regular and user-specific images
   * @param {string} imageId - The image ID/URL
   * @returns {string|null} The data URL of the image or null if not found
   */
  getImage(imageId) {
    if (!imageId) return null;
    
    // Handle regular URLs
    if (!imageId.startsWith('local-storage')) {
      return imageId;
    }
    
    // Handle user-specific images
    if (imageId.startsWith('local-storage-user://')) {
      const parts = imageId.replace('local-storage-user://', '').split('/');
      if (parts.length >= 2) {
        const userId = parts[0];
        const fileName = parts.slice(1).join('/');
        return this.getUserImage(userId, fileName);
      }
      return null;
    }
    
    // Handle regular local storage images
    if (imageId.startsWith('local-storage://')) {
      const fileName = imageId.replace('local-storage://', '');
      try {
        const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
        return storedImages[fileName] || null;
      } catch (error) {
        console.error('Error retrieving image from localStorage:', error);
        return null;
      }
    }
    
    return null;
  },
  
  /**
   * Delete an image from localStorage
   * @param {string} imageId - The unique ID/filename of the image
   * @returns {boolean} Success status
   */
  deleteImage(imageId) {
    if (!imageId) return false;
    
    // Handle user-specific images
    if (imageId.startsWith('local-storage-user://')) {
      const parts = imageId.replace('local-storage-user://', '').split('/');
      if (parts.length >= 2) {
        const userId = parts[0];
        const fileName = parts.slice(1).join('/');
        return this.deleteUserImage(userId, fileName);
      }
      return false;
    }
    
    // Handle regular local storage images
    if (imageId.startsWith('local-storage://')) {
      const fileName = imageId.replace('local-storage://', '');
      
      try {
        const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
        
        if (storedImages[fileName]) {
          delete storedImages[fileName];
          localStorage.setItem('classroomImages', JSON.stringify(storedImages));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error deleting image from localStorage:', error);
        return false;
      }
    }
    
    return false;
  },
  
  /**
   * Delete a user-specific image
   * @param {string} userId - The user ID
   * @param {string} fileName - The image filename
   * @returns {boolean} Success status
   */
  deleteUserImage(userId, fileName) {
    try {
      const userImages = JSON.parse(localStorage.getItem(`userImages_${userId}`) || '{}');
      
      if (userImages[fileName]) {
        delete userImages[fileName];
        localStorage.setItem(`userImages_${userId}`, JSON.stringify(userImages));
        console.log(`Deleted user image ${fileName} for user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting user image from localStorage:', error);
      return false;
    }
  },
  
  /**
   * Clear all images for a specific user (used on logout)
   * @param {string} userId - The user ID
   * @returns {boolean} Success status
   */
  clearUserImages(userId) {
    try {
      localStorage.removeItem(`userImages_${userId}`);
      console.log(`Cleared all images for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error clearing user images:', error);
      return false;
    }
  },
  
  /**
   * List all stored images for a user
   * @param {string} userId - The user ID
   * @returns {Array} Array of image objects with id, url, name, and timestamp
   */
  listUserImages(userId) {
    try {
      const userImages = JSON.parse(localStorage.getItem(`userImages_${userId}`) || '{}');
      
      return Object.entries(userImages).map(([fileName, imageData]) => ({
        id: `local-storage-user://${userId}/${fileName}`,
        url: imageData.dataUrl,
        name: fileName.replace(/^profile-\d+-\d+-/, ''), // Remove the prefix
        timestamp: imageData.timestamp,
        fileName: fileName
      }));
    } catch (error) {
      console.error('Error listing user images from localStorage:', error);
      return [];
    }
  },
  
  /**
   * List all stored images (legacy method)
   * @returns {Array} Array of image objects with id and url
   */
  listImages() {
    try {
      const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
      
      return Object.entries(storedImages).map(([fileName, dataUrl]) => ({
        id: `local-storage://${fileName}`,
        url: dataUrl,
        name: fileName.replace(/^user-upload-\d+-/, '') // Remove the timestamp prefix
      }));
    } catch (error) {
      console.error('Error listing images from localStorage:', error);
      return [];
    }
  },
  
  /**
   * Clear all stored images (legacy method)
   */
  clearAllImages() {
    localStorage.removeItem('classroomImages');
  },
  
  /**
   * Clear all user-specific images from localStorage
   */
  clearAllUserImages() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('userImages_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('Cleared all user images from localStorage');
    } catch (error) {
      console.error('Error clearing all user images:', error);
    }
  },
  
  /**
   * Try to free up some storage by removing oldest user images
   * @param {string} userId - The user ID
   * @returns {number} Number of images removed
   */
  cleanupUserImages(userId) {
    try {
      const userImages = JSON.parse(localStorage.getItem(`userImages_${userId}`) || '{}');
      const imageEntries = Object.entries(userImages);
      
      // If we have fewer than 3 images, don't clean up
      if (imageEntries.length < 3) return 0;
      
      // Sort by timestamp (oldest first)
      imageEntries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove the oldest 50% of images
      const removeCount = Math.max(1, Math.floor(imageEntries.length * 0.5));
      const imagesToRemove = imageEntries.slice(0, removeCount);
      
      imagesToRemove.forEach(([fileName]) => {
        delete userImages[fileName];
      });
      
      // Save back to localStorage
      localStorage.setItem(`userImages_${userId}`, JSON.stringify(userImages));
      
      console.log(`Cleaned up ${removeCount} old user images for user ${userId}`);
      return removeCount;
    } catch (error) {
      console.error('Error cleaning up user images:', error);
      return 0;
    }
  },
  
  /**
   * Try to free up some storage by removing oldest images (legacy method)
   * @returns {number} Number of images removed
   */
  cleanupStorage() {
    try {
      const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
      const imageEntries = Object.entries(storedImages);
      
      // If we have fewer than 3 images, don't clean up
      if (imageEntries.length < 3) return 0;
      
      // Sort by timestamp (assuming format: user-upload-TIMESTAMP-filename)
      imageEntries.sort((a, b) => {
        const timestampA = a[0].match(/user-upload-(\d+)-/)?.[1] || '0';
        const timestampB = b[0].match(/user-upload-(\d+)-/)?.[1] || '0';
        return parseInt(timestampA) - parseInt(timestampB);
      });
      
      // Remove the oldest 30% of images
      const removeCount = Math.max(1, Math.floor(imageEntries.length * 0.3));
      const imagesToRemove = imageEntries.slice(0, removeCount);
      
      imagesToRemove.forEach(([fileName]) => {
        delete storedImages[fileName];
      });
      
      // Save back to localStorage
      localStorage.setItem('classroomImages', JSON.stringify(storedImages));
      
      console.log(`Cleaned up ${removeCount} old images from localStorage`);
      return removeCount;
    } catch (error) {
      console.error('Error cleaning up localStorage:', error);
      return 0;
    }
  },
  
  /**
   * Get the current storage usage for a user
   * @param {string} userId - The user ID
   * @returns {Object} Storage stats
   */
  getUserStorageStats(userId) {
    try {
      const userImages = JSON.parse(localStorage.getItem(`userImages_${userId}`) || '{}');
      
      // Calculate total size
      let totalSize = 0;
      Object.values(userImages).forEach(imageData => {
        totalSize += imageData.dataUrl.length * 2; // Rough estimation (2 bytes per character)
      });
      
      return {
        count: Object.keys(userImages).length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting user storage stats:', error);
      return { count: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
  },
  
  /**
   * Get the current storage usage (legacy method)
   * @returns {Object} Storage stats
   */
  getStorageStats() {
    try {
      const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
      
      // Calculate total size
      let totalSize = 0;
      Object.values(storedImages).forEach(dataUrl => {
        totalSize += dataUrl.length * 2; // Rough estimation (2 bytes per character)
      });
      
      return {
        count: Object.keys(storedImages).length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { count: 0, totalSize: 0, totalSizeMB: '0.00' };
    }
  }
};

export default LocalImageService;