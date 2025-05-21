// src/components/common/ImageViewer.js
import React, { useState } from 'react';
import LocalImage from './LocalImage';

/**
 * Component to display an image with a clickable preview that opens a larger view
 */
const ImageViewer = ({
  src,
  alt = 'Image',
  previewStyle = {},
  previewClassName = '',
  fallbackSrc = '/images/classrooms/classroom-default.jpg',
  maxWidth = '90vw',
  maxHeight = '80vh'
}) => {
  const [showLargeView, setShowLargeView] = useState(false);
  
  const openLargeView = () => {
    setShowLargeView(true);
  };
  
  const closeLargeView = () => {
    setShowLargeView(false);
  };
  
  // Prevent clicks inside the large view from closing it
  const handleContentClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <>
      {/* Preview (clickable thumbnail) */}
      <div 
        className={`image-viewer-preview ${previewClassName}`}
        style={previewStyle}
        onClick={openLargeView}
        title="Click to enlarge"
      >
        <LocalImage
          src={src}
          alt={alt}
          fallbackSrc={fallbackSrc}
          style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
        />
        <div className="zoom-icon">🔍</div>
      </div>
      
      {/* Large view (modal) */}
      {showLargeView && (
        <div className="image-viewer-overlay" onClick={closeLargeView}>
          <div className="image-viewer-close" onClick={closeLargeView}>×</div>
          <div className="image-viewer-content" onClick={handleContentClick}>
            <LocalImage
              src={src}
              alt={alt}
              fallbackSrc={fallbackSrc}
              style={{ 
                maxWidth: maxWidth, 
                maxHeight: maxHeight, 
                objectFit: 'contain' 
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageViewer;