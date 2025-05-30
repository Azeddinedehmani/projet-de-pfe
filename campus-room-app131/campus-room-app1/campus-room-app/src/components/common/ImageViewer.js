import React, { useState, useEffect } from 'react';
import LocalImage from './LocalImage';

/**
 * Component to display an image with optional clickable preview that opens a larger view
 * UPDATED VERSION - Added clickable prop to disable enlargement functionality
 */
const ImageViewer = ({
  src,
  alt = 'Image',
  previewStyle = {},
  previewClassName = '',
  fallbackSrc = '/images/classrooms/classroom-default.jpg',
  maxWidth = '90vw',
  maxHeight = '80vh',
  clickable = true // NEW: Add clickable prop, defaults to true for backward compatibility
}) => {
  const [showLargeView, setShowLargeView] = useState(false);
  
  // Add body scroll lock when modal is open
  useEffect(() => {
    if (showLargeView) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('image-viewer-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('image-viewer-open');
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('image-viewer-open');
    };
  }, [showLargeView]);
  
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27 && showLargeView) {
        setShowLargeView(false);
      }
    };
    
    if (showLargeView) {
      document.addEventListener('keydown', handleEsc, false);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc, false);
    };
  }, [showLargeView]);
  
  const openLargeView = (e) => {
    if (!clickable) return; // Prevent opening if not clickable
    e.preventDefault();
    e.stopPropagation();
    setShowLargeView(true);
  };
  
  const closeLargeView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLargeView(false);
  };
  
  // Prevent clicks inside the large view from closing it
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Styles inline simplifiés et sans conflits
  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999999,
    padding: '24px',
    cursor: 'pointer',
    opacity: 1,
    visibility: 'visible',
    margin: 0,
    border: 'none',
    borderRadius: 0,
    boxShadow: 'none',
    transform: 'none',
    animation: 'none',
    transition: 'none',
    pointerEvents: 'auto',
    maxWidth: 'none',
    maxHeight: 'none',
    minWidth: 0,
    minHeight: 0,
    flex: 'none',
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    willChange: 'auto'
  };
  
  const closeButtonStyles = {
    position: 'fixed',
    top: '24px',
    right: '24px',
    width: '50px',
    height: '50px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    zIndex: 999999999,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    transition: 'all 0.2s ease',
    margin: 0,
    padding: 0,
    outline: 'none',
    textDecoration: 'none',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    lineHeight: 1,
    textAlign: 'center',
    pointerEvents: 'auto'
  };
  
  const contentStyles = {
    position: 'relative',
    maxWidth: maxWidth,
    maxHeight: maxHeight,
    cursor: 'default',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
    background: '#ffffff',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    opacity: 1,
    transform: 'scale(1)',
    transition: 'none',
    margin: 0,
    padding: 0,
    zIndex: 999999998,
    pointerEvents: 'auto',
    animation: 'none',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden'
  };
  
  // Image styles complètement nettoyés
  const imageStyles = {
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
    display: 'block',
    borderRadius: '20px',
    border: 'none',
    boxShadow: 'none',
    margin: 0,
    padding: 0,
    position: 'relative',
    zIndex: 1,
    opacity: 1,
    visibility: 'visible',
    transform: 'none',
    transition: 'none',
    pointerEvents: 'none',
    cursor: 'default',
    animation: 'none',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    perspective: 'none',
    WebkitPerspective: 'none'
  };
  
  const instructionsStyles = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    opacity: 0.9,
    zIndex: 999999997,
    pointerEvents: 'none',
    fontFamily: 'inherit',
    fontWeight: 'normal',
    lineHeight: 'normal',
    textAlign: 'center'
  };
  
  // Preview styles with improved hover control
  const previewStyles = {
    position: 'relative',
    cursor: clickable ? 'pointer' : 'default', // Change cursor based on clickable
    borderRadius: '12px',
    overflow: 'hidden',
    transition: clickable ? 'all 0.3s ease' : 'none', // Only add transition if clickable
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '2px solid #e5e7eb',
    ...previewStyle
  };
  
  // Zoom icon styles - only show if clickable
  const zoomIconStyles = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none'
  };
  
  return (
    <>
      {/* Preview (clickable thumbnail) */}
      <div 
        className={`iv-preview ${previewClassName}`}
        style={previewStyles}
        onClick={clickable ? openLargeView : undefined}
        title={clickable ? "Click to enlarge" : alt}
        onMouseEnter={clickable ? (e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.borderColor = '#3b82f6';
          const zoomIcon = e.currentTarget.querySelector('.iv-zoom-icon');
          if (zoomIcon) {
            zoomIcon.style.opacity = '1';
            zoomIcon.style.transform = 'translate(-50%, -50%) scale(1.1)';
          }
        } : undefined}
        onMouseLeave={clickable ? (e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.borderColor = '#e5e7eb';
          const zoomIcon = e.currentTarget.querySelector('.iv-zoom-icon');
          if (zoomIcon) {
            zoomIcon.style.opacity = '0';
            zoomIcon.style.transform = 'translate(-50%, -50%) scale(1)';
          }
        } : undefined}
      >
        <LocalImage
          src={src}
          alt={alt}
          fallbackSrc={fallbackSrc}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            cursor: clickable ? 'pointer' : 'default',
            display: 'block'
          }}
        />
        
        {/* Zoom icon - only show if clickable */}
        {clickable && (
          <div 
            className="iv-zoom-icon"
            style={zoomIconStyles}
          >
            🔍
          </div>
        )}
      </div>
      
      {/* Large view overlay - only show if clickable and showLargeView is true */}
      {clickable && showLargeView && (
        <div 
          className="iv-overlay-unique"
          style={overlayStyles}
          onClick={closeLargeView}
        >
          {/* Close button */}
          <div 
            className="iv-close-unique"
            style={closeButtonStyles}
            onClick={closeLargeView}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </div>
          
          {/* Image content */}
          <div 
            className="iv-content-unique"
            style={contentStyles}
            onClick={handleContentClick}
          >
            <LocalImage
              src={src}
              alt={alt}
              fallbackSrc={fallbackSrc}
              style={imageStyles}
              onLoad={() => {}}
              onError={() => {}}
            />
          </div>
          
          {/* Instructions */}
          <div style={instructionsStyles}>
            Click outside or press ESC to close
          </div>
        </div>
      )}
    </>
  );
};

export default ImageViewer;