// src/hooks/useSettings.js
import { useState, useEffect, useRef } from 'react';
import SettingsService from '../services/SettingsService';

/**
 * Custom hook for accessing and subscribing to system settings
 * @param {string[]|null} settingsKeys - Specific settings keys to watch, or null for all settings
 * @returns {Object} Settings state and utilities
 */
export const useSettings = (settingsKeys = null) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentSettings = await SettingsService.getSettings();
        
        if (!mounted) return;
        
        // Filter to specific keys if requested
        const filteredSettings = settingsKeys 
          ? settingsKeys.reduce((acc, key) => {
              acc[key] = currentSettings[key];
              return acc;
            }, {})
          : currentSettings;
        
        setSettings(filteredSettings);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading settings in useSettings hook:', err);
        setError(err.message || 'Failed to load settings');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Subscribe to settings changes
    unsubscribeRef.current = SettingsService.subscribe((updatedSettings) => {
      if (!mounted) return;
      
      const filteredSettings = settingsKeys 
        ? settingsKeys.reduce((acc, key) => {
            acc[key] = updatedSettings[key];
            return acc;
          }, {})
        : updatedSettings;
      
      console.log('Settings updated in useSettings hook:', filteredSettings);
      setSettings(filteredSettings);
      setError(null); // Clear any previous errors
    });

    loadSettings();

    // Cleanup function
    return () => {
      mounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [settingsKeys?.join(',')]); // Re-run if requested keys change

  // Manual refetch function
  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentSettings = await SettingsService.getSettings(true); // Force refresh
      
      const filteredSettings = settingsKeys 
        ? settingsKeys.reduce((acc, key) => {
            acc[key] = currentSettings[key];
            return acc;
          }, {})
        : currentSettings;
      
      setSettings(filteredSettings);
    } catch (err) {
      console.error('Error refetching settings:', err);
      setError(err.message || 'Failed to refetch settings');
    } finally {
      setLoading(false);
    }
  };

  // Get a specific setting value with fallback
  const getSetting = (key, defaultValue = null) => {
    return settings && settings[key] !== undefined ? settings[key] : defaultValue;
  };

  return { 
    settings, 
    loading, 
    error, 
    refetch,
    getSetting,
    isReady: !loading && !error && settings !== null
  };
};

/**
 * Hook specifically for reservation settings
 */
export const useReservationSettings = () => {
  return useSettings([
    'maxDaysInAdvance',
    'minTimeBeforeReservation',
    'maxHoursPerReservation',
    'maxReservationsPerWeek',
    'studentRequireApproval',
    'professorRequireApproval',
    'showAvailabilityCalendar'
  ]);
};

/**
 * Hook specifically for notification settings
 */
export const useNotificationSettings = () => {
  return useSettings([
    'emailNotifications',
    'reservationCreated',
    'reservationApproved',
    'reservationRejected',
    'newUserRegistered',
    'systemUpdates',
    'dailyDigest'
  ]);
};

/**
 * Hook specifically for general settings
 */
export const useGeneralSettings = () => {
  return useSettings([
    'systemName',
    'tagline',
    'contactEmail',
    'supportPhone',
    'autoApproveAdmin',
    'autoApproveProfessor',
    'autoApproveStudent'
  ]);
};