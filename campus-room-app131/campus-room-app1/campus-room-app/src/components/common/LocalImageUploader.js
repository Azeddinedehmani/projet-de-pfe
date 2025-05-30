import React, { useState, useRef } from 'react';
import LocalImageService from '../../utils/LocalImageService';
import useAuth from '../../hooks/useAuth';

// This component handles local image upload that saves to the browser's storage
// rather than the server - now with user-specific storage and professional camera button
const LocalImageUploader = ({ onImageSelect }) => {
  const { currentUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const handleImageChange = (e) => {
    setUploading(true);
    setError('');
    
    const file = e.target.files[0];
    if (!file) {
      setUploading(false);
      return;
    }
    
    console.log('LocalImageUploader: File selected:', file.name, file.type, file.size);
    console.log('LocalImageUploader: Current user ID:', currentUser?.id);
    
    // Validate file type
    const extension = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      setError('Please upload an image file (JPG, PNG, GIF, WEBP)');
      setUploading(false);
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be smaller than 5MB');
      setUploading(false);
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      // Generate a user-specific unique filename
      const timestamp = new Date().getTime();
      const userId = currentUser?.id || 'unknown';
      const cleanFileName = file.name.replace(/\s+/g, '-').toLowerCase();
      const uniqueFileName = `profile-${userId}-${timestamp}-${cleanFileName}`;
      
      console.log('LocalImageUploader: Generated filename:', uniqueFileName);
      
      // For large images, resize before storing
      if (file.size > 1024 * 1024) { // If larger than 1MB
        resizeImage(file, 1200, (resizedDataUrl) => {
          // Save to localStorage using user-specific storage
          const imageUrl = LocalImageService.saveUserImage(userId, uniqueFileName, resizedDataUrl);
          
          console.log('LocalImageUploader: Saved resized image, URL:', imageUrl);
          
          // Update state
          setSelectedImage(file.name);
          setImagePreviewUrl(resizedDataUrl);
          setUploading(false);
          
          // Notify parent component
          onImageSelect({
            target: {
              name: 'profileImageUrl',
              value: imageUrl
            }
          });
        });
      } else {
        // For smaller images, use as is
        const imageUrl = reader.result;
        
        // Save to localStorage using user-specific storage
        const storedImageUrl = LocalImageService.saveUserImage(userId, uniqueFileName, imageUrl);
        
        console.log('LocalImageUploader: Saved original image, URL:', storedImageUrl);
        
        // Update state
        setSelectedImage(file.name);
        setImagePreviewUrl(imageUrl);
        setUploading(false);
        
        // Notify parent component
        onImageSelect({
          target: {
            name: 'profileImageUrl',
            value: storedImageUrl
          }
        });
      }
    };
    
    reader.onerror = () => {
      console.error('LocalImageUploader: Error reading file');
      setError('Error reading file. Please try again.');
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  const resizeImage = (file, maxWidth, callback) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        // Calculate dimensions while preserving aspect ratio
        let width = image.width;
        let height = image.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw and resize image on canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, width, height);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(dataUrl);
      };
      image.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setImagePreviewUrl('');
    setError('');
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Notify parent component
    onImageSelect({
      target: {
        name: 'profileImageUrl',
        value: ''
      }
    });
  };

  return (
    <div className="upload-button-container">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      
      {/* Custom styled camera button */}
      <button 
        type="button"
        className="custom-upload-btn" 
        onClick={triggerFileInput}
        disabled={uploading}
      >
        <i className="fas fa-camera"></i>
        {uploading ? 'Processing...' : 'Choose Profile Image'}
      </button>
      
      {/* Upload status and controls */}
      <div className="upload-status">
        {error && (
          <div className="file-status error">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
          </div>
        )}
        
        {selectedImage && !error && (
          <div className="file-status selected">
            <div className="file-info">
              <i className="fas fa-check-circle"></i>
              <span>Selected: {selectedImage}</span>
            </div>
            <button 
              type="button"
              className="clear-file-btn"
              onClick={clearSelection}
              disabled={uploading}
              title="Remove selected image"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        
        {!selectedImage && !error && !uploading && (
          <div className="file-status">
            <i className="fas fa-info-circle"></i>
            No file selected
          </div>
        )}
      </div>
      
      {/* Image preview */}
      {imagePreviewUrl && !error && (
        <div className="upload-preview">
          <div className="preview-container">
            <img 
              src={imagePreviewUrl} 
              alt="Upload preview" 
              className="preview-image"
            />
            <div className="preview-overlay">
              <div className="preview-caption">
                <i className="fas fa-check-circle"></i>
                Image uploaded successfully!
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalImageUploader;