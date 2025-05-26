package com.campusroom.service;

import com.campusroom.model.Reservation;
import com.campusroom.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Service
public class ReservationStatusScheduler {

    @Autowired
    private ReservationRepository reservationRepository;

    /**
     * Runs every 30 minutes to update reservation statuses
     * Updates APPROVED reservations to USED when time has passed
     * Updates PENDING reservations to REJECTED when time has passed
     */
    @Scheduled(fixedRate = 1800000) // 30 minutes = 1800000 milliseconds
    @Transactional
    public void updateExpiredReservations() {
        try {
            System.out.println("ReservationStatusScheduler: Checking for expired reservations...");
            
            Date now = new Date();
            SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm");
            String currentTime = timeFormat.format(now);
            
            // Get today's date without time
            Calendar today = Calendar.getInstance();
            today.set(Calendar.HOUR_OF_DAY, 0);
            today.set(Calendar.MINUTE, 0);
            today.set(Calendar.SECOND, 0);
            today.set(Calendar.MILLISECOND, 0);
            Date todayDate = today.getTime();
            
            // Get yesterday's date
            Calendar yesterday = Calendar.getInstance();
            yesterday.add(Calendar.DAY_OF_YEAR, -1);
            yesterday.set(Calendar.HOUR_OF_DAY, 0);
            yesterday.set(Calendar.MINUTE, 0);
            yesterday.set(Calendar.SECOND, 0);
            yesterday.set(Calendar.MILLISECOND, 0);
            Date yesterdayDate = yesterday.getTime();
            
            int approvedToUsed = 0;
            int pendingToRejected = 0;
            
            // 1. Update APPROVED reservations to USED when time has passed
            List<Reservation> approvedReservations = reservationRepository.findByStatusIn(Arrays.asList("APPROVED"));
            
            for (Reservation reservation : approvedReservations) {
                boolean shouldMarkAsUsed = false;
                
                // Check if reservation date is yesterday or earlier
                if (reservation.getDate().before(todayDate)) {
                    shouldMarkAsUsed = true;
                } 
                // Check if reservation is today but end time has passed
                else if (isSameDay(reservation.getDate(), todayDate)) {
                    if (hasTimePassed(reservation.getEndTime(), currentTime)) {
                        shouldMarkAsUsed = true;
                    }
                }
                
                if (shouldMarkAsUsed) {
                    reservation.setStatus("USED");
                    reservationRepository.save(reservation);
                    approvedToUsed++;
                    System.out.println("Updated APPROVED reservation " + reservation.getId() + " to USED");
                }
            }
            
            // 2. Update PENDING reservations to REJECTED when time has passed
            List<Reservation> pendingReservations = reservationRepository.findByStatusIn(Arrays.asList("PENDING"));
            
            for (Reservation reservation : pendingReservations) {
                boolean shouldReject = false;
                
                // Check if reservation date is yesterday or earlier
                if (reservation.getDate().before(todayDate)) {
                    shouldReject = true;
                } 
                // Check if reservation is today but start time has passed
                else if (isSameDay(reservation.getDate(), todayDate)) {
                    if (hasTimePassed(reservation.getStartTime(), currentTime)) {
                        shouldReject = true;
                    }
                }
                
                if (shouldReject) {
                    reservation.setStatus("REJECTED");
                    reservation.setNotes(
                        (reservation.getNotes() != null ? reservation.getNotes() + " | " : "") +
                        "Automatically rejected - reservation time has passed without approval"
                    );
                    reservationRepository.save(reservation);
                    pendingToRejected++;
                    System.out.println("Updated PENDING reservation " + reservation.getId() + " to REJECTED (time passed)");
                }
            }
            
            if (approvedToUsed > 0 || pendingToRejected > 0) {
                System.out.println("ReservationStatusScheduler: Updated " + approvedToUsed + 
                    " APPROVED to USED, " + pendingToRejected + " PENDING to REJECTED");
            } else {
                System.out.println("ReservationStatusScheduler: No reservations needed status update");
            }
            
        } catch (Exception e) {
            System.err.println("Error in ReservationStatusScheduler: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Check if two dates are the same day
     */
    private boolean isSameDay(Date date1, Date date2) {
        Calendar cal1 = Calendar.getInstance();
        cal1.setTime(date1);
        Calendar cal2 = Calendar.getInstance();
        cal2.setTime(date2);
        
        return cal1.get(Calendar.YEAR) == cal2.get(Calendar.YEAR) &&
               cal1.get(Calendar.DAY_OF_YEAR) == cal2.get(Calendar.DAY_OF_YEAR);
    }
    
    /**
     * Check if a specific time has passed compared to current time
     * @param targetTime Time to check (HH:mm format)
     * @param currentTime Current time (HH:mm format)
     * @return true if target time has passed
     */
    private boolean hasTimePassed(String targetTime, String currentTime) {
        try {
            int targetMinutes = convertTimeToMinutes(targetTime);
            int currentMinutes = convertTimeToMinutes(currentTime);
            
            return currentMinutes >= targetMinutes;
        } catch (Exception e) {
            System.err.println("Error comparing times: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Convert time string to minutes since midnight
     */
    private int convertTimeToMinutes(String time) {
        String[] parts = time.split(":");
        int hours = Integer.parseInt(parts[0]);
        int minutes = Integer.parseInt(parts[1]);
        return hours * 60 + minutes;
    }
}