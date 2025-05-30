import React, { useEffect } from 'react';
import '../../styles/unifié.css';

const Modal = ({ show, onClose, title, children }) => {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape' && show) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open'); // Ajouter classe pour CSS
    } else {
      document.body.style.overflow = 'auto';
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
      document.body.classList.remove('modal-open');
    };
  }, [show, onClose]);

  // Close modal if clicking outside content area - VERSION AMÉLIORÉE
  const handleBackdropClick = (e) => {
    // Vérifier si le clic est sur le backdrop (pas sur le contenu)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Ne pas rendre si show est false
  if (!show) {
    return null;
  }

  // Styles inline de secours pour garantir l'affichage
  const modalStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000, // Z-index très élevé
    padding: '1rem',
    opacity: 1,
    visibility: 'visible',
    transition: 'all 0.3s ease'
  };

  const modalContentStyles = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateY(0) scale(1)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    position: 'relative'
  };

  const modalHeaderStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden'
  };

  const modalBodyStyles = {
    flex: 1,
    padding: '2rem',
    overflowY: 'auto',
    maxHeight: 'calc(90vh - 80px)'
  };

  const closeButtonStyles = {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    lineHeight: 1
  };

  return (
    <div 
      className={`modal show`} // Toujours appliquer la classe 'show'
      style={modalStyles}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="modal-content"
        style={modalContentStyles}
        onClick={(e) => e.stopPropagation()} // Empêcher la propagation du clic
      >
        <div 
          className="modal-header"
          style={modalHeaderStyles}
        >
          <h2 
            id="modal-title"
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 600,
              position: 'relative',
              zIndex: 2
            }}
          >
            {title}
          </h2>
          <span 
            className="close-modal" 
            onClick={onClose}
            style={closeButtonStyles}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'rotate(90deg)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'rotate(0deg)';
            }}
            role="button"
            aria-label="Close modal"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onClose();
              }
            }}
          >
            &times;
          </span>
        </div>
        <div 
          className="modal-body"
          style={modalBodyStyles}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;