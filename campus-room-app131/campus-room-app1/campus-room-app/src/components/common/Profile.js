import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { API } from '../../api';
import LocalImage from './LocalImage';
import LocalImageUploader from './LocalImageUploader';
import LocalImageService from '../../utils/LocalImageService';
import '../../styles/profile-styles.css';


const Profile = () => {
  const navigate = useNavigate();
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImageUrl: '',
    selectedFileName: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);
  
  // Helper function for phone validation
  const validatePhoneNumber = (phone) => {
    if (!phone || phone.trim() === '') return true;
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    return phoneRegex.test(phone);
  };
  
  // Helper function for password complexity validation
  const validatePasswordComplexity = (password) => {
    const hasDigit = /[0-9]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasNoWhitespace = !/\s/.test(password);
    
    return hasDigit && hasLowercase && hasUppercase && hasSpecial && hasNoWhitespace;
  };
  
  // Debug function to help troubleshoot image issues
  const debugImageInfo = () => {
    console.log('=== Profile Image Debug Info ===');
    console.log('Current User ID:', currentUser?.id);
    console.log('formData.profileImageUrl:', formData.profileImageUrl);
    console.log('currentUser.profileImageUrl:', currentUser?.profileImageUrl);
    
    if (formData.profileImageUrl && formData.profileImageUrl.startsWith('local-storage-user://')) {
      const parts = formData.profileImageUrl.replace('local-storage-user://', '').split('/');
      console.log('Image URL parts:', parts);
      if (parts.length >= 2) {
        const userId = parts[0];
        const fileName = parts.slice(1).join('/');
        console.log('User ID:', userId, 'File Name:', fileName);
        
        // Check localStorage directly
        try {
          const userImages = JSON.parse(localStorage.getItem(`userImages_${userId}`) || '{}');
          console.log('All user images in localStorage:', Object.keys(userImages));
          console.log('Looking for specific image:', fileName);
          console.log('Image found:', !!userImages[fileName]);
          if (userImages[fileName]) {
            console.log('Image data length:', userImages[fileName].dataUrl?.length);
          }
        } catch (e) {
          console.error('Error checking localStorage:', e);
        }
      }
    }
    
    // Check all localStorage keys
    console.log('All localStorage keys:', Object.keys(localStorage));
    const userImageKeys = Object.keys(localStorage).filter(key => key.startsWith('userImages_'));
    console.log('User image keys:', userImageKeys);
    
    console.log('=== End Debug Info ===');
  };
  
  // Check for valid token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No authentication token found');
          handleAuthError();
          return;
        }
        
        console.log('Found token, validating...');
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          const expiry = payload.exp;
          const currentTime = Math.floor(Date.now() / 1000);
          
          if (expiry < currentTime) {
            console.log('Token expired, logging out user');
            handleAuthError('Your session has expired. Please log in again.');
            return;
          }
          
          console.log('Token is valid');
        } catch (e) {
          console.log('Error decoding token:', e);
          handleAuthError('Invalid authentication token. Please log in again.');
          return;
        }
      } catch (err) {
        console.error('Error validating token:', err);
      }
    };
    
    validateToken();
  }, []);

  // Fetch profile data when component mounts or currentUser changes
  useEffect(() => {
    let isMounted = true;
    
    if (profileFetched || !currentUser) return;
    
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // First use local data for immediate display
        setFormData(prevState => ({
          ...prevState,
          id: currentUser.id,
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          department: currentUser.department || '',
          phone: currentUser.phone || '',
          profileImageUrl: currentUser.profileImageUrl || ''
        }));
        
        // Then fetch updated data from API
        try {
          console.log('Fetching profile data from backend...');
          const response = await API.profileAPI.getUserProfile();
          
          if (!isMounted) return;
          
          if (response && response.data) {
            console.log('Profile data received:', response.data);
            const profileData = response.data;
            
            // Update form with fetched data
            setFormData(prevState => ({
              ...prevState,
              id: profileData.id || prevState.id,
              firstName: profileData.firstName || prevState.firstName,
              lastName: profileData.lastName || prevState.lastName,
              email: profileData.email || prevState.email,
              department: profileData.department || prevState.department,
              phone: profileData.phone || prevState.phone,
              profileImageUrl: profileData.profileImageUrl || prevState.profileImageUrl
            }));
            
            // Update context with fresh data
            if (profileData) {
              const updatedUser = {
                ...currentUser,
                firstName: profileData.firstName || currentUser.firstName,
                lastName: profileData.lastName || currentUser.lastName,
                department: profileData.department || currentUser.department,
                phone: profileData.phone || currentUser.phone,
                profileImageUrl: profileData.profileImageUrl || currentUser.profileImageUrl,
                lastUpdated: new Date().toISOString()
              };
              
              if (isMounted) {
                updateCurrentUser(updatedUser);
              }
            }
          }
        } catch (apiError) {
          console.error('API Error fetching profile:', apiError);
          
          if (apiError.isAuthError) {
            handleAuthError(apiError.message || 'Authentication error. Please log in again.');
            return;
          }
          
          if (isMounted) {
            setError('Could not fetch profile data from server. Using locally stored data instead.');
          }
        }
      } catch (err) {
        console.error('Error in profile data handling:', err);
        if (isMounted) {
          setError('Failed to load profile data. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setProfileFetched(true);
        }
      }
    };
    
    fetchProfileData();
    
    return () => {
      isMounted = false;
    };
  }, [currentUser, updateCurrentUser, profileFetched]);
  
  // Handle authentication errors and cleanup
  const handleAuthError = (message) => {
    // Clear user-specific profile images before logging out
    if (currentUser?.id) {
      LocalImageService.clearUserImages(currentUser.id);
    }
    
    // Clear local storage
    logout();
    
    // Redirect to login with error message
    navigate('/', { 
      state: { 
        authError: true, 
        message: message || 'Authentication error. Please log in again.' 
      } 
    });
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle image selection from LocalImageUploader
  const handleImageSelect = (e) => {
    const { name, value } = e.target;
    console.log('Profile: Image selected via LocalImageUploader:', name, value);
    
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value,
      selectedFileName: value ? 'Image selected' : ''
    }));
    
    // Clear any previous errors
    setError('');
  };
  
  // Toggle edit mode
  const toggleEdit = () => {
    if (isEditing) {
      // If canceling edit, reset form data
      if (currentUser) {
        setFormData({
          ...formData,
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          department: currentUser.department || '',
          phone: currentUser.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          profileImageUrl: currentUser.profileImageUrl || '',
          selectedFileName: ''
        });
      }
      setShowPasswordSection(false);
      setMessage('');
      setError('');
    }
    setIsEditing(!isEditing);
  };
  
  // Update profile function - only sends URL to backend, not the file
  const updateProfile = async (profileData) => {
    try {
      // Create the data object to send to backend - INCLUDING the image URL
      const data = {
        id: profileData.id || currentUser.id,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email || currentUser.email,
        department: profileData.department,
        phone: profileData.phone,
        profileImageUrl: profileData.profileImageUrl // Send the local-storage URL
      };
      
      console.log('Sending profile update with data:', data);
      
      // Send update request with token validation
      const response = await API.profileAPI.updateProfile(data);
      
      if (response.data && response.data.success !== false) {
        // Update context and localStorage on success
        const updatedUser = {
          ...currentUser,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          department: profileData.department,
          phone: profileData.phone,
          profileImageUrl: profileData.profileImageUrl,
          lastUpdated: new Date().toISOString()
        };
        
        updateCurrentUser(updatedUser);
        
        return { success: true, message: 'Profile updated successfully' };
      } else {
        return { 
          success: false, 
          message: response.data?.message || 'Failed to update profile' 
        };
      }
    } catch (err) {
      console.error('Profile update error:', err);
      
      // Handle auth errors specifically
      if (err.isAuthError) {
        handleAuthError(err.message);
        return { 
          success: false, 
          authError: true,
          message: 'Your session has expired. Please log in again.'
        };
      }
      
      // Extract validation errors if available
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).join(', ');
        return {
          success: false,
          message: `Validation failed: ${errorMessages}`
        };
      }
      
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to update profile' 
      };
    }
  };
  
  // Change password function with enhanced security and complexity validation
  const changePassword = async (passwordData) => {
    try {
      // Validate passwords match
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        return { success: false, message: 'New passwords do not match' };
      }
      
      // Validate current password is provided
      if (!passwordData.currentPassword) {
        return { success: false, message: 'Current password is required' };
      }
      
      // Validate password strength
      if (passwordData.newPassword.length < 8) {
        return { success: false, message: 'New password must be at least 8 characters long' };
      }
      
      // Validate password complexity
      if (!validatePasswordComplexity(passwordData.newPassword)) {
        return { 
          success: false, 
          message: 'Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character, and no whitespace' 
        };
      }
      
      // Send password change request with token validation
      const response = await API.profileAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      
      if (response.data && response.data.success !== false) {
        return { success: true, message: 'Password changed successfully' };
      } else {
        return { 
          success: false, 
          message: response.data?.message || 'Failed to change password' 
        };
      }
    } catch (err) {
      console.error('Password change error:', err);
      
      // Handle specific error for wrong current password
      if (err.response?.status === 400 && 
          err.response?.data?.message?.includes('Current password is incorrect')) {
        return { success: false, message: 'Current password is incorrect' };
      }
      
      // Handle password complexity error
      if (err.response?.data?.errors?.newPassword) {
        return { success: false, message: err.response.data.errors.newPassword };
      }
      
      // Handle auth errors
      if (err.isAuthError) {
        handleAuthError(err.message);
        return { 
          success: false,
          authError: true,
          message: 'Your session has expired. Please log in again.'
        };
      }
      
      return { 
        success: false, 
        message: err.response?.data?.message || 'Failed to change password' 
      };
    }
  };
  
  // Handle form submission with enhanced security
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    
    // Validate token before proceeding
    const token = localStorage.getItem('token');
    if (!token) {
      handleAuthError('No authentication token found. Please log in again.');
      setLoading(false);
      return;
    }
    
    // Client-side validation
    if (!formData.firstName || formData.firstName.trim() === '') {
      setError('First name is required');
      setLoading(false);
      return;
    }
    
    if (!formData.lastName || formData.lastName.trim() === '') {
      setError('Last name is required');
      setLoading(false);
      return;
    }
    
    // Phone number validation - allow empty or valid format
    if (formData.phone && !validatePhoneNumber(formData.phone)) {
      setError('Phone number format is invalid');
      setLoading(false);
      return;
    }
    
    // Validate password complexity if changing password
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        setLoading(false);
        return;
      }
      
      if (!validatePasswordComplexity(formData.newPassword)) {
        setError('Password must contain at least one digit, one lowercase letter, one uppercase letter, one special character, and no whitespace');
        setLoading(false);
        return;
      }
    }
    
    // Check if anything has actually changed to avoid unnecessary API calls
    const hasProfileChanges = 
      formData.firstName !== currentUser.firstName ||
      formData.lastName !== currentUser.lastName ||
      formData.department !== currentUser.department ||
      formData.phone !== currentUser.phone ||
      formData.profileImageUrl !== currentUser.profileImageUrl;
    
    const hasPasswordChanges = formData.newPassword && formData.currentPassword;
    
    if (!hasProfileChanges && !hasPasswordChanges) {
      setMessage('No changes to save');
      setLoading(false);
      return;
    }
    
    try {
      let profileUpdateSuccess = true;
      let profileUpdateMessage = '';
      
      // Only update profile if something changed
      if (hasProfileChanges) {
        console.log('Updating profile with data:', {
          id: formData.id || currentUser.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: currentUser.email,
          department: formData.department,
          phone: formData.phone,
          profileImageUrl: formData.profileImageUrl
        });
        
        const profileResult = await updateProfile({
          id: formData.id || currentUser.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: currentUser.email,
          department: formData.department,
          phone: formData.phone,
          profileImageUrl: formData.profileImageUrl
        });
        
        profileUpdateSuccess = profileResult.success;
        profileUpdateMessage = profileResult.message;
        
        // If authentication error occurred, stop processing
        if (profileResult.authError) {
          setLoading(false);
          return;
        }
      }
      
      // Handle password change if requested
      let passwordChangeSuccess = true;
      let passwordChangeMessage = '';
      
      if (hasPasswordChanges) {
        const passwordResult = await changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        });
        
        passwordChangeSuccess = passwordResult.success;
        passwordChangeMessage = passwordResult.message;
        
        // If authentication error occurred, stop processing
        if (passwordResult.authError) {
          setLoading(false);
          return;
        }
      }
      
      // Determine overall success and appropriate message
      const overallSuccess = (!hasProfileChanges || profileUpdateSuccess) && 
                            (!hasPasswordChanges || passwordChangeSuccess);
      
      if (overallSuccess) {
        // Build success message based on what was updated
        let successMessage = '';
        if (hasProfileChanges && hasPasswordChanges) {
          successMessage = 'Profile and password updated successfully!';
        } else if (hasProfileChanges) {
          successMessage = profileUpdateMessage;
        } else if (hasPasswordChanges) {
          successMessage = passwordChangeMessage;
        }
        
        setMessage(successMessage);
        setIsEditing(false);
        setShowPasswordSection(false);
        
        // Reset password fields and selected file name
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          selectedFileName: ''
        }));
      } else {
        // Determine which error message to show
        if (!profileUpdateSuccess) {
          setError(profileUpdateMessage);
        } else if (!passwordChangeSuccess) {
          setError(passwordChangeMessage);
        } else {
          setError('An error occurred while updating your profile');
        }
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      
      // Handle detailed validation errors from backend
      if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).join(', ');
        setError(`Validation failed: ${errorMessages}`);
      } else if (err.isAuthError) {
        handleAuthError(err.message);
        return;
      } else {
        setError(err.response?.data?.message || 'An error occurred while updating your profile');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const getInitials = () => {
    const firstName = formData.firstName || currentUser?.firstName || '';
    const lastName = formData.lastName || currentUser?.lastName || '';
    return `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase();
  };
  
  const getUserRole = () => {
    if (!currentUser?.role) return 'User';
    
    // Convert role to proper case (e.g., "student" becomes "Student")
    return currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase();
  };
  
  // Helper function to display structured validation errors
  const renderErrorList = (errors) => {
    if (!errors || typeof errors !== 'object') return null;
    
    return (
      <ul className="error-list">
        {Object.entries(errors).map(([field, message]) => (
          <li key={field}>
            <strong>{field}:</strong> {message}
          </li>
        ))}
      </ul>
    );
  };
  
  // Call debug function to troubleshoot image issues
  debugImageInfo();
  
  if (loading && !formData.firstName) {
    return (
      <div className="main-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }
  
  // If no user is found, redirect to login
  if (!currentUser && !loading) {
    navigate('/', { 
      state: { 
        authError: true, 
        message: 'Please log in to view your profile' 
      } 
    });
    return null;
  }
  
  return (
    <div className="main-content">
      <div className="section">
        <div className="section-header">
          <h2>Profile Information</h2>
          <button 
            className={`btn-${isEditing ? 'secondary' : 'primary'}`}
            onClick={toggleEdit}
            disabled={loading}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        
        {message && (
          <div className="success-alert">
            <i className="fas fa-check-circle"></i> {message}
          </div>
        )}
        
        {error && (
          <div className="error-alert">
            <i className="fas fa-exclamation-circle"></i> {error}
            {typeof error === 'object' && renderErrorList(error)}
          </div>
        )}
        
        <div className="profile-container">
          {!isEditing ? (
            <>
              <div className="profile-header with-background">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar">
                    {formData.profileImageUrl ? (
                      <LocalImage 
                        src={formData.profileImageUrl} 
                        alt={`${formData.firstName} ${formData.lastName}`} 
                        fallbackSrc="/images/default-profile.jpg"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      getInitials()
                    )}
                  </div>
                </div>
                
                <div className="profile-header-content">
                  <div className="profile-name-group">
                    <div className="profile-name">
                      <h3>{formData.firstName} {formData.lastName}</h3>
                      {currentUser?.verified && (
                        <div className="profile-verified" title="Verified Account">
                          <i className="fas fa-check-circle"></i>
                        </div>
                      )}
                    </div>
                    <div className="profile-role">
                      {getUserRole()}
                    </div>
                  </div>
                  
                  <div className="profile-meta">
                    <div className="profile-meta-item">
                      <i className="fas fa-envelope"></i>
                      {formData.email}
                    </div>
                    {formData.department && (
                      <div className="profile-meta-item">
                        <i className="fas fa-building"></i>
                        {formData.department}
                      </div>
                    )}
                    {formData.phone && (
                      <div className="profile-meta-item">
                        <i className="fas fa-phone"></i>
                        {formData.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="profile-tabs">
                <div 
                  className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setActiveTab('personal')}
                >
                  <i className="fas fa-user"></i> Personal Information
                </div>
                <div 
                  className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  <i className="fas fa-shield-alt"></i> Security
                </div>
               
              </div>
              
              <div className={`profile-tab-content ${activeTab === 'personal' ? 'active' : ''}`}>
                <div className="profile-section">
                  <div className="profile-section-header">
                    <h3 className="profile-section-title">
                      <i className="fas fa-info-circle"></i> Basic Information
                    </h3>
                  </div>
                  
                  <div className="profile-details">
                    <div className="profile-item">
                      <div className="profile-label">
                        <i className="fas fa-user"></i> Full Name
                      </div>
                      <div className="profile-value">
                        {formData.firstName} {formData.lastName}
                      </div>
                    </div>
                    
                    <div className="profile-item">
                      <div className="profile-label">
                        <i className="fas fa-envelope"></i> Email Address
                      </div>
                      <div className="profile-value">
                        {formData.email}
                      </div>
                    </div>
                    
                    <div className="profile-item">
                      <div className="profile-label">
                        <i className="fas fa-id-badge"></i> User Role
                      </div>
                      <div className="profile-value">
                        {getUserRole()}
                      </div>
                    </div>
                    
                    {formData.department && (
                      <div className="profile-item">
                        <div className="profile-label">
                          <i className="fas fa-building"></i> Department
                        </div>
                        <div className="profile-value">
                          {formData.department}
                        </div>
                      </div>
                    )}
                    
                    {formData.phone && (
                      <div className="profile-item">
                        <div className="profile-label">
                          <i className="fas fa-phone"></i> Phone Number
                        </div>
                        <div className="profile-value">
                          {formData.phone}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={`profile-tab-content ${activeTab === 'security' ? 'active' : ''}`}>
                <div className="profile-section">
                  <div className="profile-section-header">
                    <h3 className="profile-section-title">
                      <i className="fas fa-shield-alt"></i> Account Security
                    </h3>
                  </div>
                  
                  <div className="profile-details">
                    <div className="profile-item">
                      <div className="profile-label">
                        <i className="fas fa-key"></i> Password
                      </div>
                      <div className="profile-value">
                        ••••••••
                      </div>
                      <button 
                        className="profile-edit-btn"
                        onClick={() => {
                          setIsEditing(true);
                          setShowPasswordSection(true);
                          setActiveTab('personal');
                        }}
                      >
                        <i className="fas fa-pen"></i> Change
                      </button>
                    </div>
                    
                   
                    
                    
                    
                   
                   
                  </div>
                </div>
              </div>
              

            </>
          ) : (
            <form className="profile-form" onSubmit={handleSubmit}>
              {/* Enhanced Upload Section */}
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar">
                    {formData.profileImageUrl ? (
                      <LocalImage 
                        src={formData.profileImageUrl}
                        alt={`${formData.firstName} ${formData.lastName}`}
                        fallbackSrc="/images/default-profile.jpg"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      getInitials()
                    )}
                  </div>
                </div>
                
                <div className="profile-upload-content">
                  <h3 className="profile-upload-title">Upload New Image</h3>
                  <p className="profile-upload-subtitle">Upload an image from your computer - it will be stored in your browser.</p>
                  
                  {/* Use LocalImageUploader component */}
                  <LocalImageUploader onImageSelect={handleImageSelect} />
                  
                  <p className="profile-upload-hint">
                    Images are stored locally in your browser, not on the server.
                  </p>
                </div>
              </div>
              
              <div className="profile-form-section">
                <h3 className="form-section-title">
                  <i className="fas fa-user"></i> Personal Information
                </h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">First Name</label>
                    <input 
                      type="text" 
                      id="firstName" 
                      name="firstName"
                      className="form-input"
                      value={formData.firstName}
                      onChange={handleChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">Last Name</label>
                    <input 
                      type="text" 
                      id="lastName" 
                      name="lastName"
                      className="form-input"
                      value={formData.lastName}
                      onChange={handleChange}
                      required 
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    className="form-input"
                    value={formData.email}
                    readOnly
                    disabled
                  />
                  <span className="form-hint">Email address cannot be changed</span>
                </div>
                
                <div className="form-row">
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>
                
                {!showPasswordSection ? (
                  <div className="form-group">
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => setShowPasswordSection(true)}
                      disabled={loading}
                    >
                      <i className="fas fa-key"></i> Change Password
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="form-section-title">
                      <i className="fas fa-lock"></i> Change Password
                    </h3>
                    
                    <div className="form-group">
                      <label className="form-label" htmlFor="currentPassword">Current Password</label>
                      <input 
                        type="password" 
                        id="currentPassword" 
                        name="currentPassword"
                        className="form-input"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="newPassword">New Password</label>
                        <input 
                          type="password" 
                          id="newPassword" 
                          name="newPassword"
                          className="form-input"
                          value={formData.newPassword}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <span className="form-hint">
                          Password must be at least 8 characters and include at least one digit, one lowercase letter, 
                          one uppercase letter, one special character, and no spaces
                        </span>
                      </div>
                      
                      <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                        <input 
                          type="password" 
                          id="confirmPassword" 
                          name="confirmPassword"
                          className="form-input"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => setShowPasswordSection(false)}
                        disabled={loading}
                      >
                        Cancel Password Change
                      </button>
                    </div>
                  </>
                )}
                
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={toggleEdit} disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;