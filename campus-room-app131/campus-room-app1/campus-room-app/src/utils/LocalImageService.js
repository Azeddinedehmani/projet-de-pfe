// src/utils/LocalImageService.js

/**
 * Service to manage images stored in the browser's localStorage
 * This provides an interface similar to a backend storage service
 * but keeps everything in the client's browser
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
   * Delete an image from localStorage
   * @param {string} imageId - The unique ID/filename of the image
   * @returns {boolean} Success status
   */
  deleteImage(imageId) {
    if (!imageId || !imageId.startsWith('local-storage://')) {
      return false;
    }
    
    const fileName = imageId.replace('local-storage://', '');
    
    try {
      // Get existing images
      const storedImages = JSON.parse(localStorage.getItem('classroomImages') || '{}');
      
      // Remove the image
      if (storedImages[fileName]) {
        delete storedImages[fileName];
        
        // Save back to localStorage
        localStorage.setItem('classroomImages', JSON.stringify(storedImages));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting image from localStorage:', error);
      return false;
    }
  },
  
  /**
   * List all stored images
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
   * Clear all stored images
   */
  clearAllImages() {
    localStorage.removeItem('classroomImages');
  },
  
  /**
   * Try to free up some storage by removing oldest images
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
   * Get the current storage usage
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