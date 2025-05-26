package com.campusroom.service;

import com.campusroom.model.Notification;
import com.campusroom.model.Reservation;
import com.campusroom.model.User;
import com.campusroom.repository.NotificationRepository;
import com.campusroom.repository.ReservationRepository;
import com.campusroom.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

/**
 * Service responsible for automatically rejecting pending reservations
 * when their reservation date arrives without administrative approval.
 * 
 * This prevents situations where users have pending reservations for dates
 * that have already passed, ensuring data consistency and user clarity.
 */
@Service
public class ReservationAutoRejectionService {
    private static final Logger logger = LoggerFactory.getLogger(ReservationAutoRejectionService.class);

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * MAIN SCHEDULED TASK - This is the heart of the auto-rejection system
     * 
     * Runs every day at 1:00 AM to automatically reject expired pending reservations.
     * The cron expression "0 0 1 * * *" means:
     * - 0 seconds
     * - 0 minutes  
     * - 1 hour (1:00 AM)
     * - * any day of month
     * - * any month
     * - * any day of week
     */
    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void autoRejectExpiredPendingReservations() {
        logger.info("🕐 Starting daily auto-rejection of expired pending reservations");

        try {
            // Step 1: Get today's date at midnight (start of day)
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);
            Date todayDate = today.getTime();

            logger.info("📅 Checking for pending reservations with date <= {}", 
                new SimpleDateFormat("yyyy-MM-dd").format(todayDate));

            // Step 2: Find all pending reservations where the reservation date has arrived or passed
            List<Reservation> expiredPendingReservations = reservationRepository
                    .findByStatusAndDateLessThanEqual("PENDING", todayDate);

            logger.info("🔍 Found {} expired pending reservations to auto-reject", 
                expiredPendingReservations.size());

            // Step 3: Process each expired reservation
            int rejectedCount = 0;
            int errorCount = 0;

            for (Reservation reservation : expiredPendingReservations) {
                try {
                    // Update the reservation status and add explanation
                    processExpiredReservation(reservation);
                    rejectedCount++;
                    
                    logger.info("✅ Auto-rejected reservation {} for user {} (Room: {}, Date: {})", 
                        reservation.getId(), 
                        reservation.getUser().getEmail(), 
                        reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "N/A",
                        new SimpleDateFormat("yyyy-MM-dd").format(reservation.getDate()));

                } catch (Exception e) {
                    errorCount++;
                    logger.error("❌ Error auto-rejecting reservation {}: {}", 
                        reservation.getId(), e.getMessage(), e);
                }
            }

            // Step 4: Log final results
            logger.info("🎯 Auto-rejection completed: {} successful, {} errors", rejectedCount, errorCount);

            // Step 5: Notify admins if there were any errors
            if (errorCount > 0) {
                notifyAdminsAboutErrors(errorCount, rejectedCount);
            }

        } catch (Exception e) {
            logger.error("💥 Critical error during auto-rejection process: {}", e.getMessage(), e);
        }
    }

    /**
     * Process a single expired reservation
     * This method handles the actual rejection logic for one reservation
     */
    private void processExpiredReservation(Reservation reservation) {
        // Step 1: Update reservation status to REJECTED
        reservation.setStatus("REJECTED");
        
        // Step 2: Add clear explanation in notes
        String autoRejectionNote = "Auto-rejected: Reservation date arrived without approval.";
        if (reservation.getNotes() != null && !reservation.getNotes().trim().isEmpty()) {
            reservation.setNotes(reservation.getNotes() + " | " + autoRejectionNote);
        } else {
            reservation.setNotes(autoRejectionNote);
        }
        
        // Step 3: Save the updated reservation
        reservationRepository.save(reservation);

        // Step 4: Create user notification
        createAutoRejectionNotification(reservation);
    }

    /**
     * Create an in-app notification for the user about the auto-rejection
     * This appears in their notification panel
     */
    private void createAutoRejectionNotification(Reservation reservation) {
        try {
            Notification notification = new Notification();
            notification.setTitle("Reservation Auto-Rejected");
            
            // Create a clear, helpful message
            String message = String.format(
                "Your reservation for %s on %s from %s to %s has been automatically rejected " +
                "because the reservation date arrived without administrative approval. " +
                "For future reservations, please submit requests earlier to allow time for approval.",
                reservation.getClassroom() != null ? reservation.getClassroom().getRoomNumber() : "the classroom",
                new SimpleDateFormat("dd/MM/yyyy").format(reservation.getDate()),
                reservation.getStartTime(),
                reservation.getEndTime()
            );
            
            notification.setMessage(message);
            notification.setUser(reservation.getUser());
            notification.setRead(false);
            notification.setIconClass("fas fa-calendar-times");
            notification.setIconColor("red");

            notificationRepository.save(notification);
            logger.debug("📨 Created auto-rejection notification for user {}", reservation.getUser().getEmail());

        } catch (Exception e) {
            logger.error("❌ Error creating auto-rejection notification for reservation {}: {}", 
                reservation.getId(), e.getMessage(), e);
        }
    }

    /**
     * Notify administrators if there were errors during auto-rejection
     * This helps admins monitor the system health
     */
    private void notifyAdminsAboutErrors(int errorCount, int successCount) {
        try {
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            
            for (User admin : admins) {
                Notification notification = new Notification();
                notification.setTitle("Auto-Rejection Process Completed with Errors");
                notification.setMessage(String.format(
                    "The daily auto-rejection process completed with %d errors and %d successful rejections. " +
                    "Please check the system logs for details.",
                    errorCount, successCount
                ));
                notification.setUser(admin);
                notification.setRead(false);
                notification.setIconClass("fas fa-exclamation-triangle");
                notification.setIconColor("orange");

                notificationRepository.save(notification);
            }
            
            logger.info("📢 Notified {} admins about auto-rejection errors", admins.size());
            
        } catch (Exception e) {
            logger.error("❌ Error notifying admins about auto-rejection errors: {}", e.getMessage(), e);
        }
    }

    /**
     * MANUAL TRIGGER METHOD
     * Allows administrators to manually run the auto-rejection process
     * Useful for testing or handling special situations
     */
    @Transactional
    public AutoRejectionResult manualAutoRejectExpiredReservations() {
        logger.info("🔧 Manual trigger for auto-rejection of expired pending reservations");
        
        Calendar today = Calendar.getInstance();
        today.set(Calendar.HOUR_OF_DAY, 0);
        today.set(Calendar.MINUTE, 0);
        today.set(Calendar.SECOND, 0);
        today.set(Calendar.MILLISECOND, 0);
        Date todayDate = today.getTime();

        List<Reservation> expiredPendingReservations = reservationRepository
                .findByStatusAndDateLessThanEqual("PENDING", todayDate);

        int rejectedCount = 0;
        int errorCount = 0;

        for (Reservation reservation : expiredPendingReservations) {
            try {
                processExpiredReservation(reservation);
                rejectedCount++;
            } catch (Exception e) {
                errorCount++;
                logger.error("❌ Error in manual auto-rejection for reservation {}: {}", 
                    reservation.getId(), e.getMessage(), e);
            }
        }

        logger.info("🎯 Manual auto-rejection completed: {} successful, {} errors", rejectedCount, errorCount);
        
        return new AutoRejectionResult(rejectedCount, errorCount, expiredPendingReservations.size());
    }

    /**
     * Result class to return information about the auto-rejection process
     */
    public static class AutoRejectionResult {
        private final int rejectedCount;
        private final int errorCount;
        private final int totalFound;

        public AutoRejectionResult(int rejectedCount, int errorCount, int totalFound) {
            this.rejectedCount = rejectedCount;
            this.errorCount = errorCount;
            this.totalFound = totalFound;
        }

        public int getRejectedCount() { return rejectedCount; }
        public int getErrorCount() { return errorCount; }
        public int getTotalFound() { return totalFound; }
        public boolean isSuccessful() { return errorCount == 0; }
    }
}