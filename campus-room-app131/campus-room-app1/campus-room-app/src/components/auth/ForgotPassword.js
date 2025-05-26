import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: verification code, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    password: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { resetPassword, verifyCode, resetPasswordWithCode } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const result = await resetPassword(formData.email);
      
      if (result.success) {
        setSuccess(result.message);
        setStep(2); // Move to verification code step
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to send verification code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.verificationCode.length !== 5) {
      setError('Verification code must be 5 digits');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const result = await verifyCode(formData.email, formData.verificationCode);
      
      if (result.success) {
        setSuccess('Code verified successfully!');
        setStep(3); // Move to password reset step
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to verify code');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const result = await resetPasswordWithCode(
        formData.email,
        formData.verificationCode,
        formData.password,
        formData.confirmPassword
      );
      
      if (result.success) {
        setSuccess(result.message);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to reset password');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleCodeSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-icon">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="disabled-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="verificationCode">Verification Code</label>
              <div className="input-icon">
                <i className="fas fa-key"></i>
                <input 
                  type="text" 
                  id="verificationCode" 
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleChange}
                  maxLength="5"
                  placeholder="Enter 5-digit code"
                  required 
                />
              </div>
              <small>Check your email for the 5-digit verification code</small>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <button 
              type="button" 
              className="btn-secondary mt-2" 
              onClick={() => setStep(1)}
            >
              Back to Email
            </button>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="input-icon">
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            
            <button 
              type="button" 
              className="btn-secondary mt-2" 
              onClick={() => setStep(2)}
            >
              Back to Verification
            </button>
          </form>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Password';
      case 2: return 'Enter Verification Code';
      case 3: return 'Create New Password';
      default: return 'Reset Password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Enter your email address and we\'ll send you a verification code.';
      case 2: return 'Enter the 5-digit code sent to your email.';
      case 3: return 'Create a new password for your account.';
      default: return '';
    }
  };

  return (
    <div className="landing-container">
      <div className="branding">
        <div className="logo-container">
          <img src="/images/logo.png" alt="Campus Room Logo" className="logo" />
          <h1>Campus<span>Room</span></h1>
        </div>
        <p className="tagline">Smart Classroom Management System</p>
      </div>
      
      <div className="auth-card">
        <div className="auth-sidebar">
          <h2>{getStepTitle()}</h2>
          <p>{getStepDescription()}</p>
          
          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
          
          <p className="new-account">Remember your password? <Link to="/">Sign in</Link></p>
        </div>
        
        <div className="auth-form">
          <h2>{getStepTitle()}</h2>
          
          {error && <div className="error-alert">{error}</div>}
          {success && <div className="success-alert">{success}</div>}
          
          {renderStep()}
          
          <div className="mt-3 text-center">
            <Link to="/register">Need an account? Register</Link>
          </div>
        </div>
      </div>
      
      <div className="footer">
        <p>&copy; 2025 CampusRoom. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ForgotPassword;