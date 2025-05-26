// src/components/common/LocalImage.js
import React, { useState, useEffect } from 'react';
import LocalImageService from '../../utils/LocalImageService';

/**
 * Component to display images that may be stored in localStorage
 * This component handles both regular URLs and localStorage URLs (including user-specific)
 */
const LocalImage = ({ 
  src, 
  alt = 'Image', 
  className = '', 
  style = {}, 
  width, 
  height,
  fallbackSrc = '/images/default-profile.jpg'
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Reset states when src changes
    setError(false);
    setLoading(true);
    
    console.log('LocalImage: Loading image with src:', src);
    
    if (!src) {
      console.log('LocalImage: No src provided, using fallback');
      setImageSrc(fallbackSrc);
      setLoading(false);
      return;
    }
    
    // Handle different types of image sources
    const loadImage = async () => {
      try {
        if (src.startsWith('local-storage-user://')) {
          // Handle user-specific localStorage images
          console.log('LocalImage: Loading user-specific image:', src);
          const imageData = LocalImageService.getImage(src);
          if (imageData) {
            console.log('LocalImage: User image loaded successfully, data length:', imageData.length);
            setImageSrc(imageData);
          } else {
            console.warn(`LocalImage: User-specific image not found: ${src}`);
            setImageSrc(fallbackSrc);
            setError(true);
          }
        } else if (src.startsWith('local-storage://')) {
          // Handle regular localStorage images
          console.log('LocalImage: Loading regular localStorage image:', src);
          const imageData = LocalImageService.getImage(src);
          if (imageData) {
            console.log('LocalImage: Regular localStorage image loaded successfully');
            setImageSrc(imageData);
          } else {
            console.warn(`LocalImage: Regular localStorage image not found: ${src}`);
            setImageSrc(fallbackSrc);
            setError(true);
          }
        } else if (src.startsWith('data:')) {
          // Handle data URLs directly
          console.log('LocalImage: Loading data URL image');
          setImageSrc(src);
        } else if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
          // Handle regular URLs
          console.log('LocalImage: Loading regular URL image:', src);
          setImageSrc(src);
        } else {
          // Unknown format, try as regular URL
          console.log('LocalImage: Unknown image format, trying as regular URL:', src);
          setImageSrc(src);
        }
      } catch (err) {
        console.error('LocalImage: Error loading image:', err);
        setImageSrc(fallbackSrc);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadImage();
  }, [src, fallbackSrc]);
  
  const handleImageError = (e) => {
    if (!error) {
      console.warn(`LocalImage: Failed to load image: ${src}`);
      setImageSrc(fallbackSrc);
      setError(true);
    }
  };
  
  const handleImageLoad = () => {
    console.log('LocalImage: Image loaded successfully');
    setLoading(false);
    setError(false);
  };
  
  // Combine passed style with any width/height props
  const combinedStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    ...(loading ? { opacity: 0.7 } : {})
  };
  
  // Check if this is being used as an avatar (has avatar-image class)
  const isAvatar = className.includes('avatar-image');
  
  if (isAvatar) {
    // For avatar images, ensure perfect circular fit
    return (
      <div className={`local-image-wrapper ${loading ? 'loading' : ''}`}>
        <img
          src={imageSrc}
          alt={alt}
          className={className}
          style={{
            ...combinedStyle,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </div>
    );
  }
  
  // For non-avatar images, use regular styling
  return (
    <div className="local-image-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          fontSize: '12px',
          color: '#666',
          zIndex: 1
        }}>
          Loading...
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        style={combinedStyle}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default LocalImage;