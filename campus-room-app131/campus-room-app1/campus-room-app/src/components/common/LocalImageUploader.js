import React, { useState } from 'react';
import LocalImageService from '../../utils/LocalImageService';
import useAuth from '../../hooks/useAuth';

// This component handles local image upload that saves to the browser's storage
// rather than the server - now with user-specific storage
const LocalImageUploader = ({ onImageSelect }) => {
  const { currentUser } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const handleImageChange = (e) => {
    setUploading(true);
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
      alert('Please upload an image file (JPG, PNG, GIF, WEBP)');
      setUploading(false);
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file must be smaller than 5MB');
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
          setSelectedImage(uniqueFileName);
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
        setSelectedImage(uniqueFileName);
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
      alert('Error reading file. Please try again.');
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

  return (
    <div className="local-image-uploader">
      <div className="form-group">
        <label htmlFor="local-image-upload">Upload New Image</label>
        <input
          type="file"
          id="local-image-upload"
          accept="image/*"
          onChange={handleImageChange}
          className="form-control"
          disabled={uploading}
        />
        <small className="form-hint">
          Upload an image from your computer - it will be stored in your browser.
          {uploading && ' Processing image...'}
        </small>
      </div>
      
      {imagePreviewUrl && (
        <div className="upload-preview">
          <img 
            src={imagePreviewUrl} 
            alt="Upload preview" 
            style={{ maxWidth: '100%', maxHeight: '150px' }}
          />
          <div className="preview-caption">Image uploaded successfully!</div>
        </div>
      )}
    </div>
  );
};

export default LocalImageUploader;