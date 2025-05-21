package com.campusroom.controller;

import com.campusroom.dto.DashboardStatsDTO;
import com.campusroom.dto.ReportDataDTO;
import com.campusroom.service.ReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {
    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);
    
    @Autowired
    private ReportService reportService;
    
    /**
     * Get complete report data for admin dashboard
     * @param forceRefresh Force refresh from database
     * @return Complete report data
     */
    @GetMapping
    public ResponseEntity<ReportDataDTO> getReportsData(
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        logger.info("GET /api/reports - forceRefresh: {}", forceRefresh);
        ReportDataDTO reportData = reportService.getCompleteReportData(forceRefresh);
        return ResponseEntity.ok(reportData);
    }
    
    /**
     * Get dashboard stats
     * @param forceRefresh Force refresh from database
     * @return Dashboard stats
     */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        logger.info("GET /api/reports/stats - forceRefresh: {}", forceRefresh);
        DashboardStatsDTO stats = reportService.getDashboardStats(forceRefresh);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get popular rooms
     * @param forceRefresh Force refresh from database
     * @param limit Maximum number of rooms to return
     * @return List of popular rooms
     */
    @GetMapping("/popular-rooms")
    public ResponseEntity<List<ReportDataDTO.PopularRoomDTO>> getPopularRooms(
            @RequestParam(defaultValue = "false") boolean forceRefresh,
            @RequestParam(defaultValue = "5") int limit) {
        logger.info("GET /api/reports/popular-rooms - forceRefresh: {}, limit: {}", forceRefresh, limit);
        List<ReportDataDTO.PopularRoomDTO> popularRooms = reportService.getPopularRooms(forceRefresh, limit);
        return ResponseEntity.ok(popularRooms);
    }
    
    /**
     * Get active users
     * @param forceRefresh Force refresh from database
     * @param limit Maximum number of users to return
     * @return List of active users
     */
    @GetMapping("/active-users")
    public ResponseEntity<List<ReportDataDTO.ActiveUserDTO>> getActiveUsers(
            @RequestParam(defaultValue = "false") boolean forceRefresh,
            @RequestParam(defaultValue = "5") int limit) {
        logger.info("GET /api/reports/active-users - forceRefresh: {}, limit: {}", forceRefresh, limit);
        List<ReportDataDTO.ActiveUserDTO> activeUsers = reportService.getActiveUsers(forceRefresh, limit);
        return ResponseEntity.ok(activeUsers);
    }
    
    /**
     * Get monthly activity
     * @param forceRefresh Force refresh from database
     * @return List of monthly activity
     */
    @GetMapping("/monthly-activity")
    public ResponseEntity<List<ReportDataDTO.MonthlyActivityDTO>> getMonthlyActivity(
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        logger.info("GET /api/reports/monthly-activity - forceRefresh: {}", forceRefresh);
        List<ReportDataDTO.MonthlyActivityDTO> monthlyActivity = reportService.getMonthlyActivity(forceRefresh);
        return ResponseEntity.ok(monthlyActivity);
    }
    
    /**
     * Get users by role
     * @param forceRefresh Force refresh from database
     * @return Map of role to user count
     */
    @GetMapping("/users-by-role")
    public ResponseEntity<Map<String, Integer>> getUsersByRole(
            @RequestParam(defaultValue = "false") boolean forceRefresh) {
        logger.info("GET /api/reports/users-by-role - forceRefresh: {}", forceRefresh);
        Map<String, Integer> usersByRole = reportService.getUsersByRole(forceRefresh);
        return ResponseEntity.ok(usersByRole);
    }
    
    /**
     * Force regeneration of all reports
     * @return Success status
     */
    @PostMapping("/regenerate")
    public ResponseEntity<Map<String, String>> regenerateReports() {
        logger.info("POST /api/reports/regenerate");
        try {
            reportService.regenerateAllReports();
            reportService.clearCache();
            return ResponseEntity.ok(Map.of("status", "success", "message", "Reports regenerated successfully"));
        } catch (Exception e) {
            logger.error("Error regenerating reports", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("status", "error", "message", "Failed to regenerate reports: " + e.getMessage()));
        }
    }
    
    /**
     * Export data as CSV
     * @return CSV file
     */
    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportCsv() {
        logger.info("GET /api/reports/csv");
        try {
            // Get complete report data
            ReportDataDTO reportData = reportService.getCompleteReportData(false);
            
            // Build CSV content
            StringBuilder csv = new StringBuilder();
            
            // Add header
            csv.append("Report generated on: ").append(new java.util.Date()).append("\n\n");
            
            // Add system stats
            csv.append("SYSTEM OVERVIEW\n");
            csv.append("Total Reservations,").append(reportData.getStatistics().get("totalReservations")).append("\n");
            csv.append("Approved Reservations,").append(reportData.getStatistics().get("approvedReservations")).append("\n");
            csv.append("Pending Reservations,").append(reportData.getStatistics().get("pendingReservations")).append("\n");
            csv.append("Professor Reservations,").append(reportData.getStatistics().get("professorReservations")).append("\n");
            csv.append("Student Reservations,").append(reportData.getStatistics().get("studentReservations")).append("\n");
            csv.append("Total Classrooms,").append(reportData.getStatistics().get("totalClassrooms")).append("\n");
            csv.append("Total Users,").append(reportData.getStatistics().get("totalUsers")).append("\n\n");
            
            // Add popular rooms
            csv.append("POPULAR ROOMS\n");
            csv.append("Room,Reservations,Usage Percentage\n");
            for (ReportDataDTO.PopularRoomDTO room : reportData.getPopularRooms()) {
                csv.append(room.getRoom()).append(",")
                   .append(room.getCount()).append(",")
                   .append(String.format("%.1f%%", room.getPercentage())).append("\n");
            }
            csv.append("\n");
            
            // Add active users
            csv.append("ACTIVE USERS\n");
            csv.append("User,Role,Reservations\n");
            for (ReportDataDTO.ActiveUserDTO user : reportData.getActiveUsers()) {
                csv.append(user.getUserName()).append(",")
                   .append(user.getRole()).append(",")
                   .append(user.getCount()).append("\n");
            }
            csv.append("\n");
            
            // Add monthly activity
            csv.append("MONTHLY ACTIVITY\n");
            csv.append("Month,Professor Reservations,Student Reservations,Admin Reservations,Total\n");
            for (ReportDataDTO.MonthlyActivityDTO month : reportData.getMonthlyActivity()) {
                csv.append(month.getMonth()).append(",")
                   .append(month.getProfessorCount()).append(",")
                   .append(month.getStudentCount()).append(",")
                   .append(month.getAdminCount()).append(",")
                   .append(month.getTotal()).append("\n");
            }
            
            // Set up headers for file download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "campus_room_report.csv");
            
            return new ResponseEntity<>(csv.toString().getBytes(StandardCharsets.UTF_8), headers, HttpStatus.OK);
        } catch (Exception e) {
            logger.error("Error exporting CSV", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
    
    /**
     * Export data for PDF generation
     * @return Data in format suitable for PDF generation
     */
    @GetMapping("/pdf-data")
    public ResponseEntity<Map<String, Object>> getPdfData() {
        logger.info("GET /api/reports/pdf-data");
        try {
            Map<String, Object> pdfData = reportService.generatePDFReportData();
            return ResponseEntity.ok(pdfData);
        } catch (Exception e) {
            logger.error("Error generating PDF data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}