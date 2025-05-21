// src/components/common/LocalImage.js
import React, { useState, useEffect } from 'react';
import LocalImageService from '../../utils/LocalImageService';

/**
 * Component to display images that may be stored in localStorage
 * This component handles both regular URLs and localStorage URLs
 */
const LocalImage = ({ 
  src, 
  alt = 'Image', 
  className = '', 
  style = {}, 
  width, 
  height,
  fallbackSrc = '/images/classrooms/classroom-default.jpg'
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Reset error state when src changes
    setError(false);
    
    if (!src) {
      setImageSrc(fallbackSrc);
      return;
    }
    
    if (src.startsWith('local-storage://')) {
      // This is a localStorage image
      const localImage = LocalImageService.getImage(src);
      if (localImage) {
        setImageSrc(localImage);
      } else {
        console.warn(`Local image not found: ${src}`);
        setImageSrc(fallbackSrc);
        setError(true);
      }
    } else {
      // This is a regular URL
      setImageSrc(src);
    }
  }, [src, fallbackSrc]);
  
  const handleImageError = () => {
    if (!error) {
      console.warn(`Failed to load image: ${src}`);
      setImageSrc(fallbackSrc);
      setError(true);
    }
  };
  
  // Combine passed style with any width/height props
  const combinedStyle = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {})
  };
  
  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={combinedStyle}
      onError={handleImageError}
    />
  );
};

export default LocalImage;