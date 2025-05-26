package com.campusroom.service;

import com.campusroom.model.Classroom;
import com.campusroom.model.ClassGroup;
import com.campusroom.model.Reservation;
import com.campusroom.model.TimetableEntry;
import com.campusroom.repository.ClassGroupRepository;
import com.campusroom.repository.ClassroomRepository;
import com.campusroom.repository.ReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.*;

/**
 * Centralized service for checking classroom availability
 * This service prevents double-booking between timetable entries and ad-hoc reservations
 * ENHANCED VERSION with improved conflict detection and detailed reporting
 */
@Service
public class ClassroomAvailabilityService {
    private static final Logger logger = LoggerFactory.getLogger(ClassroomAvailabilityService.class);
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    @Autowired
    private ClassGroupRepository classGroupRepository;
    
    @Autowired
    private ClassroomRepository classroomRepository;
    
    // Cache to store class timetables for better performance
    private Map<String, List<TimetableEntry>> classroomTimetableCache = new HashMap<>();
    
    // Timestamp of when the cache was last refreshed
    private long cacheLastRefreshed = 0;
    
    // Cache timeout in milliseconds (5 minutes)
    private static final long CACHE_TIMEOUT = 5 * 60 * 1000;
    
    /**
     * Check if a classroom is available for a given date and time period
     */
    public boolean isClassroomAvailable(String classroomId, Date date, String startTime, String endTime) {
        logger.info("Checking availability for classroom {}, date {}, time {}-{}", 
                   classroomId, date, startTime, endTime);
        
        try {
            // Check for ad-hoc reservation conflicts
            if (!checkAdHocAvailability(classroomId, date, startTime, endTime)) {
                logger.info("Classroom {} has ad-hoc reservation conflict on {} at {}-{}", 
                           classroomId, date, startTime, endTime);
                return false;
            }
            
            // Check for timetable conflicts
            if (!checkTimetableAvailability(classroomId, date, startTime, endTime)) {
                logger.info("Classroom {} has timetable conflict on {} at {}-{}", 
                           classroomId, date, startTime, endTime);
                return false;
            }
            
            // If we passed both checks, the classroom is available
            logger.info("✅ Classroom {} is available on {} at {}-{}", classroomId, date, startTime, endTime);
            return true;
        } catch (Exception e) {
            logger.error("Error checking classroom availability: {}", e.getMessage(), e);
            // In case of any error, return false to be safe (prevent double booking)
            return false;
        }
    }
    
    /**
     * Check for conflicts with existing ad-hoc reservations
     */
    private boolean checkAdHocAvailability(String classroomId, Date date, String startTime, String endTime) {
        // Get reservations with APPROVED or PENDING status
        List<Reservation> existingReservations = reservationRepository.findByClassroomIdAndDateAndStatusIn(
                classroomId, date, Arrays.asList("APPROVED", "PENDING"));
        
        // Convert request times to minutes
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        logger.debug("Checking {} existing reservations for classroom {}", existingReservations.size(), classroomId);
        
        // Check for any overlap with existing reservations
        for (Reservation reservation : existingReservations) {
            int reservationStartMinutes = convertTimeToMinutes(reservation.getStartTime());
            int reservationEndMinutes = convertTimeToMinutes(reservation.getEndTime());
            
            // If there's an overlap, the classroom is not available
            if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, 
                             reservationStartMinutes, reservationEndMinutes)) {
                logger.warn("❌ RESERVATION CONFLICT: Classroom {} already reserved by {} {} from {} to {} ({})", 
                          classroomId, 
                          reservation.getUser().getFirstName(), 
                          reservation.getUser().getLastName(),
                          reservation.getStartTime(), 
                          reservation.getEndTime(),
                          reservation.getStatus());
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * IMPROVED: Check for conflicts with regular timetable entries
     */
    private boolean checkTimetableAvailability(String classroomId, Date date, String startTime, String endTime) {
        // Get the day of week from the date
        String dayOfWeek = getDayOfWeekFromDate(date);
        
        // Convert request times to minutes for easier comparison
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        logger.debug("Checking timetable conflicts for classroom {} on {} at {}-{}", 
                   classroomId, dayOfWeek, startTime, endTime);
        
        // IMPROVED: Get all class groups and check their timetable entries directly
        // This ensures we catch all conflicts even if cache is stale
        List<ClassGroup> allClassGroups = classGroupRepository.findAll();
        
        for (ClassGroup classGroup : allClassGroups) {
            if (classGroup.getTimetableEntries() == null) continue;
            
            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                // ENHANCED: Multiple ways to match classroom location
                if (isClassroomMatch(classroomId, entry.getLocation()) && 
                    entry.getDay().equalsIgnoreCase(dayOfWeek)) {
                    
                    int entryStartMinutes = convertTimeToMinutes(entry.getStartTime());
                    int entryEndMinutes = convertTimeToMinutes(entry.getEndTime());
                    
                    // Check for time overlap
                    if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, 
                                     entryStartMinutes, entryEndMinutes)) {
                        
                        logger.warn("❌ CLASS SCHEDULE CONFLICT: Classroom {} is already scheduled for class group '{}' - '{}' on {} from {} to {}", 
                                  classroomId, classGroup.getName(), entry.getName(), dayOfWeek, entry.getStartTime(), entry.getEndTime());
                        return false;
                    }
                }
            }
        }
        
        logger.debug("✅ No timetable conflicts found for classroom {}", classroomId);
        return true;
    }
    
    /**
     * NEW: Improved classroom matching logic
     * Handles both classroom ID and room number matching
     */
    private boolean isClassroomMatch(String classroomId, String timetableLocation) {
        if (classroomId == null || timetableLocation == null) {
            return false;
        }
        
        // Clean and normalize both values
        String cleanClassroomId = classroomId.trim();
        String cleanLocation = timetableLocation.trim();
        
        // Direct ID match
        if (cleanClassroomId.equals(cleanLocation)) {
            return true;
        }
        
        // Try to get classroom by ID and match room number
        try {
            Optional<Classroom> classroomOpt = classroomRepository.findById(cleanClassroomId);
            if (classroomOpt.isPresent()) {
                Classroom classroom = classroomOpt.get();
                // Match by room number (exact)
                if (classroom.getRoomNumber().equals(cleanLocation)) {
                    return true;
                }
                // Match case-insensitive room number
                if (classroom.getRoomNumber().equalsIgnoreCase(cleanLocation)) {
                    return true;
                }
            }
        } catch (Exception e) {
            logger.debug("Error looking up classroom {}: {}", cleanClassroomId, e.getMessage());
        }
        
        // Try to find classroom by room number and match ID
        try {
            List<Classroom> classrooms = classroomRepository.findAll();
            for (Classroom classroom : classrooms) {
                if (classroom.getRoomNumber().equals(cleanLocation) && 
                    classroom.getId().equals(cleanClassroomId)) {
                    return true;
                }
                // Also check case-insensitive
                if (classroom.getRoomNumber().equalsIgnoreCase(cleanLocation) && 
                    classroom.getId().equals(cleanClassroomId)) {
                    return true;
                }
            }
        } catch (Exception e) {
            logger.debug("Error searching classrooms: {}", e.getMessage());
        }
        
        return false;
    }
    
    /**
     * ENHANCED: Refresh the timetable cache with improved location resolution
     */
    private void refreshTimetableCache() {
        logger.info("Refreshing timetable cache for conflict detection");
        
        // Clear the existing cache
        classroomTimetableCache.clear();
        
        // Get all class groups with their timetable entries
        List<ClassGroup> allClassGroups = classGroupRepository.findAll();
        
        // Populate the cache with improved location matching
        for (ClassGroup classGroup : allClassGroups) {
            if (classGroup.getTimetableEntries() != null) {
                for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                    if (entry.getLocation() != null && !entry.getLocation().trim().isEmpty()) {
                        String location = entry.getLocation().trim();
                        
                        // Try to resolve location to classroom ID
                        String classroomId = resolveLocationToClassroomId(location);
                        
                        if (classroomId != null) {
                            // Add the entry to the cache using the resolved classroom ID
                            if (!classroomTimetableCache.containsKey(classroomId)) {
                                classroomTimetableCache.put(classroomId, new ArrayList<>());
                            }
                            classroomTimetableCache.get(classroomId).add(entry);
                            
                            logger.debug("Cached timetable entry for classroom {}: {} on {} at {}-{}", 
                                       classroomId, classGroup.getName(), entry.getDay(), 
                                       entry.getStartTime(), entry.getEndTime());
                        }
                    }
                }
            }
        }
        
        // Update the timestamp
        cacheLastRefreshed = System.currentTimeMillis();
        
        logger.info("Timetable cache refreshed. Cached {} classrooms with {} total entries.", 
                   classroomTimetableCache.size(), 
                   classroomTimetableCache.values().stream().mapToInt(List::size).sum());
    }
    
    /**
     * NEW: Resolve timetable location to actual classroom ID
     */
    private String resolveLocationToClassroomId(String location) {
        try {
            // First, check if location is already a classroom ID
            if (classroomRepository.existsById(location)) {
                return location;
            }
            
            // Try to find by room number
            List<Classroom> allClassrooms = classroomRepository.findAll();
            for (Classroom classroom : allClassrooms) {
                if (classroom.getRoomNumber().equals(location) || 
                    classroom.getRoomNumber().equalsIgnoreCase(location)) {
                    return classroom.getId();
                }
            }
            
            logger.debug("Could not resolve location '{}' to a classroom ID", location);
            return location; // Return original location if can't resolve
            
        } catch (Exception e) {
            logger.error("Error resolving location '{}' to classroom ID: {}", location, e.getMessage());
            return location; // Return original location on error
        }
    }
    
    /**
     * Check if two time periods overlap
     */
    private boolean hasTimeOverlap(int start1, int end1, int start2, int end2) {
        // Two periods overlap if one starts before the other ends and ends after the other starts
        return start1 < end2 && end1 > start2;
    }
    
    /**
     * Convert a time string (HH:mm) to minutes since midnight
     */
    private int convertTimeToMinutes(String time) {
        try {
            String[] parts = time.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);
            return hours * 60 + minutes;
        } catch (Exception e) {
            logger.error("Invalid time format: {}. Expected HH:mm", time);
            throw new IllegalArgumentException("Invalid time format: " + time);
        }
    }
    
    /**
     * Get the day of week from a Date object
     */
    private String getDayOfWeekFromDate(Date date) {
        LocalDate localDate = date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        DayOfWeek dayOfWeek = localDate.getDayOfWeek();
        return dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH);
    }
    
    /**
     * Check availability for a specific class group (excluding its own entries)
     * Used by ClassGroupService to avoid false conflicts when updating a group's schedule
     */
    public boolean isClassroomAvailableForClassGroup(String classroomId, Date date, String startTime, 
                                                  String endTime, Long classGroupId) {
        logger.debug("Checking classroom availability for class group {} (excluding own entries)", classGroupId);
        
        // Check ad-hoc reservations
        if (!checkAdHocAvailability(classroomId, date, startTime, endTime)) {
            return false;
        }
        
        // Check timetable entries, excluding the current class group
        String dayOfWeek = getDayOfWeekFromDate(date);
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        List<ClassGroup> classGroups = classGroupRepository.findAll();
        
        for (ClassGroup classGroup : classGroups) {
            // Skip current class group to avoid false conflicts
            if (classGroup.getId().equals(classGroupId)) {
                continue;
            }
            
            if (classGroup.getTimetableEntries() == null) continue;
            
            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                // ENHANCED: Use improved classroom matching
                if (isClassroomMatch(classroomId, entry.getLocation()) && 
                    entry.getDay().equalsIgnoreCase(dayOfWeek)) {
                    
                    int entryStartMinutes = convertTimeToMinutes(entry.getStartTime());
                    int entryEndMinutes = convertTimeToMinutes(entry.getEndTime());
                    
                    if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, entryStartMinutes, entryEndMinutes)) {
                        logger.warn("Class group conflict: Classroom {} already used by class group '{}' on {} at {}-{}", 
                                  classroomId, classGroup.getName(), dayOfWeek, entry.getStartTime(), entry.getEndTime());
                        return false;  // Conflict found
                    }
                }
            }
        }
        
        return true;  // No conflicts found
    }
    
    /**
     * NEW: Get detailed information about conflicts for a classroom at a specific time
     */
    public ConflictInfo getDetailedConflictInfo(String classroomId, Date date, String startTime, String endTime) {
        String dayOfWeek = getDayOfWeekFromDate(date);
        
        // Check ad-hoc reservations
        List<String> reservationConflicts = new ArrayList<>();
        List<Reservation> existingReservations = reservationRepository.findByClassroomIdAndDateAndStatusIn(
                classroomId, date, Arrays.asList("APPROVED", "PENDING"));
        
        int requestStartMinutes = convertTimeToMinutes(startTime);
        int requestEndMinutes = convertTimeToMinutes(endTime);
        
        for (Reservation reservation : existingReservations) {
            int reservationStartMinutes = convertTimeToMinutes(reservation.getStartTime());
            int reservationEndMinutes = convertTimeToMinutes(reservation.getEndTime());
            
            if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, 
                             reservationStartMinutes, reservationEndMinutes)) {
                reservationConflicts.add(String.format("Reservation by %s %s from %s to %s (%s)", 
                    reservation.getUser().getFirstName(), 
                    reservation.getUser().getLastName(),
                    reservation.getStartTime(), 
                    reservation.getEndTime(),
                    reservation.getStatus()));
            }
        }
        
        // Check class group timetables
        List<String> classConflicts = new ArrayList<>();
        List<ClassGroup> allClassGroups = classGroupRepository.findAll();
        
        for (ClassGroup classGroup : allClassGroups) {
            if (classGroup.getTimetableEntries() == null) continue;
            
            for (TimetableEntry entry : classGroup.getTimetableEntries()) {
                if (isClassroomMatch(classroomId, entry.getLocation()) && 
                    entry.getDay().equalsIgnoreCase(dayOfWeek)) {
                    
                    int entryStartMinutes = convertTimeToMinutes(entry.getStartTime());
                    int entryEndMinutes = convertTimeToMinutes(entry.getEndTime());
                    
                    if (hasTimeOverlap(requestStartMinutes, requestEndMinutes, 
                                     entryStartMinutes, entryEndMinutes)) {
                        classConflicts.add(String.format("Class '%s' (%s) from %s to %s", 
                            entry.getName(), 
                            classGroup.getName(),
                            entry.getStartTime(), 
                            entry.getEndTime()));
                    }
                }
            }
        }
        
        return new ConflictInfo(reservationConflicts, classConflicts);
    }
    
    /**
     * Clean expired entries from cache
     * This can be called by a scheduled task
     */
    public void cleanCache() {
        classroomTimetableCache.clear();
        cacheLastRefreshed = 0;
        logger.info("Timetable cache cleared");
    }
    
    /**
     * ConflictInfo class for detailed conflict reporting
     */
    public static class ConflictInfo {
        private final List<String> reservationConflicts;
        private final List<String> classConflicts;
        
        public ConflictInfo(List<String> reservationConflicts, List<String> classConflicts) {
            this.reservationConflicts = reservationConflicts != null ? reservationConflicts : new ArrayList<>();
            this.classConflicts = classConflicts != null ? classConflicts : new ArrayList<>();
        }
        
        public boolean hasConflicts() {
            return !reservationConflicts.isEmpty() || !classConflicts.isEmpty();
        }
        
        public List<String> getReservationConflicts() { 
            return reservationConflicts; 
        }
        
        public List<String> getClassConflicts() { 
            return classConflicts; 
        }
        
        public String getDetailedMessage() {
            if (!hasConflicts()) {
                return "No conflicts found";
            }
            
            StringBuilder message = new StringBuilder("Conflicts detected:\n");
            
            if (!classConflicts.isEmpty()) {
                message.append("📚 Class Schedule Conflicts:\n");
                for (String conflict : classConflicts) {
                    message.append("  • ").append(conflict).append("\n");
                }
            }
            
            if (!reservationConflicts.isEmpty()) {
                message.append("📅 Reservation Conflicts:\n");
                for (String conflict : reservationConflicts) {
                    message.append("  • ").append(conflict).append("\n");
                }
            }
            
            return message.toString();
        }
        
        public String getShortMessage() {
            if (!hasConflicts()) {
                return "Available";
            }
            
            List<String> issues = new ArrayList<>();
            if (!classConflicts.isEmpty()) {
                issues.add(classConflicts.size() + " class schedule conflict(s)");
            }
            if (!reservationConflicts.isEmpty()) {
                issues.add(reservationConflicts.size() + " reservation conflict(s)");
            }
            
            return String.join(" and ", issues);
        }
    }
}