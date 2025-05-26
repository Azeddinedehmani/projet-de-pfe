package com.campusroom.controller;

import com.campusroom.dto.*;
import com.campusroom.service.AdminService;
import com.campusroom.service.ReportService;
import com.campusroom.service.ReservationAutoRejectionService;
import com.campusroom.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Date;
import org.springframework.format.annotation.DateTimeFormat;
import com.campusroom.service.ClassroomAvailabilityService;
import com.campusroom.service.ReservationStatusScheduler;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;
    
       @Autowired
    private ReservationStatusScheduler reservationStatusScheduler;
    
    @Autowired
private ClassroomAvailabilityService availabilityService;
    
    // Add this to your existing @Autowired section
@Autowired
private ReservationAutoRejectionService reservationAutoRejectionService;
    
    @Autowired
    private ReportService reportService;
    
    @Autowired
    private ReservationService reservationService;
    
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        return ResponseEntity.ok(reportService.getDashboardStats(forceRefresh));
    }
    
    @GetMapping("/dashboard/notifications")
    public ResponseEntity<List<NotificationDTO>> getNotifications() {
        return ResponseEntity.ok(adminService.getNotifications());
    }
    
    @GetMapping("/dashboard/recent-reservations")
    public ResponseEntity<List<ReservationDTO>> getRecentReservations() {
        return ResponseEntity.ok(reservationService.getRecentReservations());
    }
    
    @GetMapping("/dashboard/pending-demands")
    public ResponseEntity<List<DemandDTO>> getPendingDemands() {
        return ResponseEntity.ok(reservationService.getPendingDemands());
    }
    
    @GetMapping("/reports")
    public ResponseEntity<ReportDataDTO> getReportsData(
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        return ResponseEntity.ok(reportService.getCompleteReportData(forceRefresh));
    }
    
    @PutMapping("/approve-reservation/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveReservation(@PathVariable String id) {
        System.out.println("PUT /api/admin/approve-reservation/" + id);
        try {
            ReservationDTO approvedReservation = reservationService.approveReservation(id);
            return ResponseEntity.ok(approvedReservation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }

    @PutMapping("/reject-reservation/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectReservation(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> requestBody) {
        System.out.println("PUT /api/admin/reject-reservation/" + id);
        try {
            String reason = requestBody != null ? requestBody.get("reason") : null;
            
            // Validate reason
            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "success", false,
                                "message", "Rejection reason is required"
                        ));
            }
            
            ReservationDTO rejectedReservation = reservationService.rejectReservation(id, reason);
            return ResponseEntity.ok(rejectedReservation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", e.getMessage()
                    ));
        }
    }
    
    @GetMapping("/user-notifications/{userId}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(@PathVariable Long userId) {
        System.out.println("GET /api/admin/user-notifications/" + userId);
        return ResponseEntity.ok(adminService.getUserNotifications(userId));
    }
    
    @GetMapping("/reservations")
    public ResponseEntity<List<ReservationDTO>> getAllReservations() {
        System.out.println("GET /api/admin/reservations");
        return ResponseEntity.ok(reservationService.getAllReservations());
    }
    
    @GetMapping("/reservations/status/{status}")
    public ResponseEntity<List<ReservationDTO>> getReservationsByStatus(@PathVariable String status) {
        System.out.println("GET /api/admin/reservations/status/" + status);
        return ResponseEntity.ok(reservationService.getReservationsByStatus(status));
    }
    
    // Add this method to your controller
@PostMapping("/auto-reject-expired")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> manualAutoRejectExpiredReservations() {
    System.out.println("POST /api/admin/auto-reject-expired - Manual auto-rejection trigger");
    try {
        ReservationAutoRejectionService.AutoRejectionResult result = 
            reservationAutoRejectionService.manualAutoRejectExpiredReservations();
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Auto-rejection process completed",
            "rejectedCount", result.getRejectedCount(),
            "errorCount", result.getErrorCount(),
            "totalFound", result.getTotalFound()
        ));
    } catch (Exception e) {
        System.err.println("Error in manual auto-rejection: " + e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "message", "Error during auto-rejection: " + e.getMessage()
                ));
    }
}
@GetMapping("/check-classroom-conflicts")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> checkClassroomConflicts(
        @RequestParam String classroomId,
        @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") Date date,
        @RequestParam String startTime,
        @RequestParam String endTime) {
    
    try {
        boolean isAvailable = availabilityService.isClassroomAvailable(classroomId, date, startTime, endTime);
        ClassroomAvailabilityService.ConflictInfo conflictInfo = 
            availabilityService.getDetailedConflictInfo(classroomId, date, startTime, endTime);
        
        return ResponseEntity.ok(Map.of(
            "available", isAvailable,
            "hasConflicts", conflictInfo.hasConflicts(),
            "reservationConflicts", conflictInfo.getReservationConflicts(),
            "classConflicts", conflictInfo.getClassConflicts(),
            "shortMessage", conflictInfo.getShortMessage(),
            "detailedMessage", conflictInfo.getDetailedMessage()
        ));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of(
            "error", e.getMessage()
        ));
    }
}
@PostMapping("/update-reservation-statuses")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> updateReservationStatuses() {
    System.out.println("POST /api/admin/update-reservation-statuses - Manual trigger");
    try {
        // You'll need to inject the ReservationStatusScheduler
        reservationStatusScheduler.updateExpiredReservations();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Reservation statuses updated successfully"
        ));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "success", false,
                        "message", "Error updating reservation statuses: " + e.getMessage()
                ));
    }
}
}