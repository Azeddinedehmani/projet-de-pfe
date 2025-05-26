// src/hooks/useProfileLoader.js
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../api';

/**
 * Custom hook to load complete profile data after login
 * This ensures profile images and other data are available immediately
 */
const useProfileLoader = () => {
  const { currentUser, updateCurrentUser } = useAuth();
  const hasFetchedProfile = useRef(false);
  
  useEffect(() => {
    // Only fetch if user exists, hasn't been fetched yet, and we don't have complete profile data
    if (!currentUser || hasFetchedProfile.current || currentUser.profileDataLoaded) {
      return;
    }
    
    const fetchCompleteProfile = async () => {
      try {
        console.log('useProfileLoader: Fetching complete profile data...');
        
        const response = await API.profileAPI.getUserProfile();
        
        if (response && response.data) {
          console.log('useProfileLoader: Profile data received:', response.data);
          
          const profileData = response.data;
          
          // Update context with complete profile data
          const updatedUser = {
            ...currentUser,
            firstName: profileData.firstName || currentUser.firstName,
            lastName: profileData.lastName || currentUser.lastName,
            department: profileData.department || currentUser.department,
            phone: profileData.phone || currentUser.phone,
            profileImageUrl: profileData.profileImageUrl || currentUser.profileImageUrl,
            profileDataLoaded: true, // Flag to prevent re-fetching
            lastUpdated: new Date().toISOString()
          };
          
          updateCurrentUser(updatedUser);
          hasFetchedProfile.current = true;
          
          console.log('useProfileLoader: Profile data updated in context');
        }
      } catch (error) {
        console.error('useProfileLoader: Error fetching profile data:', error);
        
        // Mark as loaded even if failed to prevent infinite retries
        if (currentUser) {
          updateCurrentUser({
            ...currentUser,
            profileDataLoaded: true
          });
        }
        hasFetchedProfile.current = true;
      }
    };
    
    fetchCompleteProfile();
  }, [currentUser, updateCurrentUser]);
  
  return {
    isProfileLoaded: currentUser?.profileDataLoaded || false
  };
};

export default useProfileLoader;