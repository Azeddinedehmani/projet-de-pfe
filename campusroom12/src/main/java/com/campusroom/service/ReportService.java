package com.campusroom.service;

import com.campusroom.dto.*;
import com.campusroom.model.*;
import com.campusroom.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Calendar;
import java.text.SimpleDateFormat;
import java.text.ParseException;

@Service
public class ReportService {
    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Cache expiry time (15 minutes)
    private static final long CACHE_EXPIRY_MS = 15 * 60 * 1000;
    
    // Report types
    public static final String REPORT_SYSTEM_STATS = "system_stats";
    public static final String REPORT_POPULAR_ROOMS = "popular_rooms";
    public static final String REPORT_ACTIVE_USERS = "active_users";
    public static final String REPORT_MONTHLY_ACTIVITY = "monthly_activity";
    public static final String REPORT_USERS_BY_ROLE = "users_by_role";
    public static final String REPORT_COMPLETE = "complete_report";
    
    // Repositories
    @Autowired
    private ReportRepository reportRepository;
    
    @Autowired
    private ClassroomRepository classroomRepository;
    
    @Autowired
    private ReservationRepository reservationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private SystemSettingsRepository settingsRepository;
    
    // Cache for reports to reduce database load
    private final Map<String, CachedReport> reportCache = new HashMap<>();
    
    // Inner class for cached reports
    private static class CachedReport {
        private final Object data;
        private final long timestamp;
        
        public CachedReport(Object data) {
            this.data = data;
            this.timestamp = System.currentTimeMillis();
        }
        
        public boolean isExpired() {
            return System.currentTimeMillis() - timestamp > CACHE_EXPIRY_MS;
        }
        
        public Object getData() {
            return data;
        }
    }
    
    /**
     * Gets complete report data for admin dashboard
     * @param forceRefresh Force refresh from database
     * @return Complete report data
     */
    public ReportDataDTO getCompleteReportData(boolean forceRefresh) {
        if (!forceRefresh) {
            // Check cache first
            CachedReport cachedReport = reportCache.get(REPORT_COMPLETE);
            if (cachedReport != null && !cachedReport.isExpired()) {
                logger.debug("Using cached complete report data");
                return (ReportDataDTO) cachedReport.getData();
            }
        }
        
        try {
            // Try to get from database first
            Date currentDate = new Date();
            Optional<Report> report = reportRepository.findValidReport(REPORT_COMPLETE, currentDate);
            
            if (report.isPresent() && !forceRefresh) {
                try {
                    ReportDataDTO reportData = objectMapper.readValue(
                            report.get().getReportData(), ReportDataDTO.class);
                    // Update cache
                    reportCache.put(REPORT_COMPLETE, new CachedReport(reportData));
                    return reportData;
                } catch (Exception e) {
                    logger.error("Error deserializing report data", e);
                }
            }
            
            // Generate fresh report
            ReportDataDTO reportData = generateCompleteReport();
            
            // Store in database
            saveReportToDatabase(REPORT_COMPLETE, reportData, "daily");
            
            // Update cache
            reportCache.put(REPORT_COMPLETE, new CachedReport(reportData));
            
            return reportData;
        } catch (Exception e) {
            logger.error("Error generating complete report", e);
            throw new RuntimeException("Failed to generate complete report", e);
        }
    }
    
    /**
     * Gets system stats for dashboard
     * @param forceRefresh Force refresh from database
     * @return Dashboard stats DTO
     */
    public DashboardStatsDTO getDashboardStats(boolean forceRefresh) {
        if (!forceRefresh) {
            // Check cache first
            CachedReport cachedReport = reportCache.get(REPORT_SYSTEM_STATS);
            if (cachedReport != null && !cachedReport.isExpired()) {
                logger.debug("Using cached system stats");
                return (DashboardStatsDTO) cachedReport.getData();
            }
        }
        
        try {
            // Try to get from database first
            Date currentDate = new Date();
            Optional<Report> report = reportRepository.findValidReport(REPORT_SYSTEM_STATS, currentDate);
            
            if (report.isPresent() && !forceRefresh) {
                try {
                    DashboardStatsDTO stats = objectMapper.readValue(
                            report.get().getReportData(), DashboardStatsDTO.class);
                    // Update cache
                    reportCache.put(REPORT_SYSTEM_STATS, new CachedReport(stats));
                    return stats;
                } catch (Exception e) {
                    logger.error("Error deserializing system stats", e);
                }
            }
            
            // Generate fresh stats
            DashboardStatsDTO stats = generateSystemStats();
            
            // Store in database
            saveReportToDatabase(REPORT_SYSTEM_STATS, stats, "hourly");
            
            // Update cache
            reportCache.put(REPORT_SYSTEM_STATS, new CachedReport(stats));
            
            return stats;
        } catch (Exception e) {
            logger.error("Error generating system stats", e);
            throw new RuntimeException("Failed to generate system stats", e);
        }
    }
    
    /**
     * Gets popular rooms
     * @param forceRefresh Force refresh from database
     * @param limit Maximum number of rooms to return
     * @return List of popular room DTOs
     */
    public List<ReportDataDTO.PopularRoomDTO> getPopularRooms(boolean forceRefresh, int limit) {
        String cacheKey = REPORT_POPULAR_ROOMS + "_" + limit;
        
        if (!forceRefresh) {
            // Check cache first
            CachedReport cachedReport = reportCache.get(cacheKey);
            if (cachedReport != null && !cachedReport.isExpired()) {
                logger.debug("Using cached popular rooms");
                @SuppressWarnings("unchecked")
                List<ReportDataDTO.PopularRoomDTO> rooms = 
                    (List<ReportDataDTO.PopularRoomDTO>) cachedReport.getData();
                return rooms;
            }
        }
        
        try {
            // Try to get from database first
            Date currentDate = new Date();
            Optional<Report> report = reportRepository.findValidReport(REPORT_POPULAR_ROOMS, currentDate);
            
            if (report.isPresent() && !forceRefresh) {
                try {
                    @SuppressWarnings("unchecked")
                    List<ReportDataDTO.PopularRoomDTO> rooms = objectMapper.readValue(
                            report.get().getReportData(), 
                            objectMapper.getTypeFactory().constructCollectionType(
                                List.class, ReportDataDTO.PopularRoomDTO.class));
                                
                    // Limit results
                    List<ReportDataDTO.PopularRoomDTO> limitedRooms = 
                        rooms.stream().limit(limit).collect(Collectors.toList());
                        
                    // Update cache
                    reportCache.put(cacheKey, new CachedReport(limitedRooms));
                    return limitedRooms;
                } catch (Exception e) {
                    logger.error("Error deserializing popular rooms", e);
                }
            }
            
            // Generate fresh data
            List<ReportDataDTO.PopularRoomDTO> popularRooms = generatePopularRooms();
            
            // Store in database
            saveReportToDatabase(REPORT_POPULAR_ROOMS, popularRooms, "daily");
            
            // Limit results
            List<ReportDataDTO.PopularRoomDTO> limitedRooms = 
                popularRooms.stream().limit(limit).collect(Collectors.toList());
                
            // Update cache
            reportCache.put(cacheKey, new CachedReport(limitedRooms));
            
            return limitedRooms;
        } catch (Exception e) {
            logger.error("Error generating popular rooms", e);
            throw new RuntimeException("Failed to generate popular rooms", e);
        }
    }
    
    /**
     * Gets most active users
     * @param forceRefresh Force refresh from database
     * @param limit Maximum number of users to return
     * @return List of active user DTOs
     */
    public List<ReportDataDTO.ActiveUserDTO> getActiveUsers(boolean forceRefresh, int limit) {
        String cacheKey = REPORT_ACTIVE_USERS + "_" + limit;
        
        if (!forceRefresh) {
            // Check cache first
            CachedReport cachedReport = reportCache.get(cacheKey);
            if (cachedReport != null && !cachedReport.isExpired()) {
                logger.debug("Using cached active users");
                @SuppressWarnings("unchecked")
                List<ReportDataDTO.ActiveUserDTO> users = 
                    (List<ReportDataDTO.ActiveUserDTO>) cachedReport.getData();
                return users;
            }
        }
        
        try {
            // Try to get from database first
            Date currentDate = new Date();
            Optional<Report> report = reportRepository.findValidReport(REPORT_ACTIVE_USERS, currentDate);
            
            if (report.isPresent() && !forceRefresh) {
                try {
                    @SuppressWarnings("unchecked")
                    List<ReportDataDTO.ActiveUserDTO> users = objectMapper.readValue(
                            report.get().getReportData(), 
                            objectMapper.getTypeFactory().constructCollectionType(
                                List.class, ReportDataDTO.ActiveUserDTO.class));
                                
                    // Limit results
                    List<ReportDataDTO.ActiveUserDTO> limitedUsers = 
                        users.stream().limit(limit).collect(Collectors.toList());
                        
                    // Update cache
                    reportCache.put(cacheKey, new CachedReport(limitedUsers));
                    return limitedUsers;
                } catch (Exception e) {
                    logger.error("Error deserializing active users", e);
                }
            }
            
            // Generate fresh data
            List<ReportDataDTO.ActiveUserDTO> activeUsers = generateActiveUsers();
            
            // Store in database
            saveReportToDatabase(REPORT_ACTIVE_USERS, activeUsers, "daily");
            
            // Limit results
            List<ReportDataDTO.ActiveUserDTO> limitedUsers = 
                activeUsers.stream().limit(limit).collect(Collectors.toList());
                
            // Update cache
            reportCache.put(cacheKey, new CachedReport(limitedUsers));
            
            return limitedUsers;
        } catch (Exception e) {
            logger.error("Error generating active users", e);
            throw new RuntimeException("Failed to generate active users", e);
        }
    }
    
    /**
     * Gets monthly activity
     * @param forceRefresh Force refresh from database
     * @return List of monthly activity DTOs
     */
    public List<ReportDataDTO.MonthlyActivityDTO> getMonthlyActivity(boolean forceRefresh) {
        if (!forceRefresh) {
            // Check cache first
            CachedReport cachedReport = reportCache.get(REPORT_MONTHLY_ACTIVITY);
            if (cachedReport != null && !cachedReport.isExpired()) {
                logger.debug("Using cached monthly activity");
                @SuppressWarnings("unchecked")
                List<ReportDataDTO.MonthlyActivityDTO> activity = 
                    (List<ReportDataDTO.MonthlyActivityDTO>) cachedReport.getData();
                return activity;
            }
        }
        
        try {
            // Try to get from database first
            Date currentDate = new Date();
            Optional<Report> report = reportRepository.findValidReport(REPORT_MONTHLY_ACTIVITY, currentDate);
            
            if (report.isPresent() && !forceRefresh) {
                try {
                    @SuppressWarnings("unchecked")
                    List<ReportDataDTO.MonthlyActivityDTO> activity = objectMapper.readValue(
                            report.get().getReportData(), 
                            objectMapper.getTypeFactory().constructCollectionType(
                                List.class, ReportDataDTO.MonthlyActivityDTO.class));
                                
                    // Update cache
                    reportCache.put(REPORT_MONTHLY_ACTIVITY, new CachedReport(activity));
                    return activity;
                } catch (Exception e) {
                    logger.error("Error deserializing monthly activity", e);
                }
            }
            
            // Generate fresh data
            List<ReportDataDTO.MonthlyActivityDTO> monthlyActivity = generateMonthlyActivity();
            
            // Store in database
            saveReportToDatabase(REPORT_MONTHLY_ACTIVITY, monthlyActivity, "monthly");
            
            // Update cache
            reportCache.put(REPORT_MONTHLY_ACTIVITY, new CachedReport(monthlyActivity));
            
            return monthlyActivity;
        } catch (Exception e) {
            logger.error("Error generating monthly activity", e);
            throw new RuntimeException("Failed to generate monthly activity", e);
        }
    }
    
    /**
     * Gets users by role statistics
     * @param forceRefresh Force refresh from database
     * @return Map of role to count
     */
    public Map<String, Integer> getUsersByRole(boolean forceRefresh) {
        if (!forceRefresh) {
            // Check cache first
            CachedReport cachedReport = reportCache.get(REPORT_USERS_BY_ROLE);
            if (cachedReport != null && !cachedReport.isExpired()) {
                logger.debug("Using cached users by role");
                @SuppressWarnings("unchecked")
                Map<String, Integer> usersByRole = 
                    (Map<String, Integer>) cachedReport.getData();
                return usersByRole;
            }
        }
        
        try {
            // Try to get from database first
            Date currentDate = new Date();
            Optional<Report> report = reportRepository.findValidReport(REPORT_USERS_BY_ROLE, currentDate);
            
            if (report.isPresent() && !forceRefresh) {
                try {
                    @SuppressWarnings("unchecked")
                    Map<String, Integer> usersByRole = objectMapper.readValue(
                            report.get().getReportData(), 
                            objectMapper.getTypeFactory().constructMapType(
                                Map.class, String.class, Integer.class));
                                
                    // Update cache
                    reportCache.put(REPORT_USERS_BY_ROLE, new CachedReport(usersByRole));
                    return usersByRole;
                } catch (Exception e) {
                    logger.error("Error deserializing users by role", e);
                }
            }
            
            // Generate fresh data
            Map<String, Integer> usersByRole = generateUsersByRole();
            
            // Store in database
            saveReportToDatabase(REPORT_USERS_BY_ROLE, usersByRole, "daily");
            
            // Update cache
            reportCache.put(REPORT_USERS_BY_ROLE, new CachedReport(usersByRole));
            
            return usersByRole;
        } catch (Exception e) {
            logger.error("Error generating users by role", e);
            throw new RuntimeException("Failed to generate users by role", e);
        }
    }
    
    /**
     * Scheduled job to regenerate reports
     * Runs daily at 1:00 AM to refresh all reports
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void regenerateAllReports() {
        logger.info("Starting scheduled report regeneration");
        
        try {
            // Regenerate all report types
            generateSystemStats();
            generatePopularRooms();
            generateActiveUsers();
            generateMonthlyActivity();
            generateUsersByRole();
            generateCompleteReport();
            
            // Clean up old reports (older than 30 days)
            Calendar cal = Calendar.getInstance();
            cal.add(Calendar.DAY_OF_MONTH, -30);
            reportRepository.deleteOldReports(cal.getTime());
            
            logger.info("Completed scheduled report regeneration");
        } catch (Exception e) {
            logger.error("Error during scheduled report regeneration", e);
        }
    }
    
    /**
     * Generate system stats from database tables
     */
    private DashboardStatsDTO generateSystemStats() {
        logger.debug("Generating system stats from database");
        
        // Get counts directly from repositories
        int totalClassrooms = (int) classroomRepository.count();
        int activeReservations = reservationRepository.countByStatus("APPROVED");
        int pendingDemands = reservationRepository.countByStatus("PENDING");
        int totalUsers = (int) userRepository.count();
        
        // Breakdown of classrooms by type
        int lectureHalls = classroomRepository.countByType("Lecture Hall");
        int regularClassrooms = classroomRepository.countByType("Classroom");
        int computerLabs = classroomRepository.countByType("Computer Lab");
        
        String classroomBreakdown = lectureHalls + " lecture halls, " + 
                                   regularClassrooms + " classrooms, " + 
                                   computerLabs + " labs";
        
        // Breakdown of reservations by role
        int professorReservations = reservationRepository.countByUserRoleAndStatus(User.Role.PROFESSOR, "APPROVED");
        int studentReservations = reservationRepository.countByUserRoleAndStatus(User.Role.STUDENT, "APPROVED");
        
        String reservationBreakdown = professorReservations + " by professors, " + 
                                     studentReservations + " by students";
        
        return DashboardStatsDTO.builder()
                .totalClassrooms(totalClassrooms)
                .activeReservations(activeReservations)
                .pendingDemands(pendingDemands)
                .totalUsers(totalUsers)
                .classroomBreakdown(classroomBreakdown)
                .reservationBreakdown(reservationBreakdown)
                .build();
    }
    
    /**
     * Generate popular rooms from reservation data
     */
    private List<ReportDataDTO.PopularRoomDTO> generatePopularRooms() {
        logger.debug("Generating popular rooms from database");
        
        // Get popular rooms directly from repository using the custom query
        List<Object[]> popularClassrooms = reservationRepository.findPopularClassrooms(PageRequest.of(0, 10));
        long totalReservations = reservationRepository.count();
        
        // Process results into DTOs
        List<ReportDataDTO.PopularRoomDTO> popularRooms = new ArrayList<>();
        
        for (Object[] result : popularClassrooms) {
            String room = (String) result[0];
            long count = (long) result[1];
            double percentage = (double) count / totalReservations * 100;
            
            // Get role breakdown for this room
            int professorCount = 0;
            int studentCount = 0;
            int adminCount = 0;
            int unknownCount = 0;
            
            // Get classroom object
            Classroom classroom = classroomRepository.findById(room).orElse(null);
            if (classroom != null) {
                // Count reservations by role for this classroom
                List<Reservation> roomReservations = reservationRepository.findByClassroom(classroom);
                
                for (Reservation res : roomReservations) {
                    User.Role role = res.getUser().getRole();
                    if (role == User.Role.PROFESSOR) {
                        professorCount++;
                    } else if (role == User.Role.STUDENT) {
                        studentCount++;
                    } else if (role == User.Role.ADMIN) {
                        adminCount++;
                    } else {
                        unknownCount++;
                    }
                }
            }
            
            popularRooms.add(ReportDataDTO.PopularRoomDTO.builder()
                    .room(room)
                    .count(count)
                    .percentage(percentage)
                    .build());
        }
        
        return popularRooms;
    }
    
    /**
     * Generate active users from reservation data
     */
    private List<ReportDataDTO.ActiveUserDTO> generateActiveUsers() {
        logger.debug("Generating active users from database");
        
        // Get most active users directly from repository
        List<Object[]> activeUsers = reservationRepository.findMostActiveUsers(PageRequest.of(0, 10));
        
        // Process results into DTOs
        List<ReportDataDTO.ActiveUserDTO> activeUserDTOs = new ArrayList<>();
        
        for (Object[] result : activeUsers) {
            Long userId = (Long) result[0];
            long count = (long) result[1];
            
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                activeUserDTOs.add(ReportDataDTO.ActiveUserDTO.builder()
                        .userId(userId.toString())
                        .userName(user.getFirstName() + " " + user.getLastName())
                        .role(user.getRole().name())
                        .count(count)
                        .build());
            }
        }
        
        return activeUserDTOs;
    }
    
    /**
     * Generate monthly activity from reservation data
     */
    private List<ReportDataDTO.MonthlyActivityDTO> generateMonthlyActivity() {
        logger.debug("Generating monthly activity from database");
        
        // Get activity by role and month directly from repository
        List<Object[]> professorActivity = reservationRepository.countReservationsByMonthAndRole(User.Role.PROFESSOR);
        List<Object[]> studentActivity = reservationRepository.countReservationsByMonthAndRole(User.Role.STUDENT);
        
        // Process results
        Map<Integer, Integer> professorCounts = new HashMap<>();
        for (Object[] result : professorActivity) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            professorCounts.put(month, count.intValue());
        }
        
        Map<Integer, Integer> studentCounts = new HashMap<>();
        for (Object[] result : studentActivity) {
            Integer month = (Integer) result[0];
            Long count = (Long) result[1];
            studentCounts.put(month, count.intValue());
        }
        
        // For admin role, which might not be directly available
        Map<Integer, Integer> adminCounts = new HashMap<>();
        try {
            List<Object[]> adminActivity = reservationRepository.countReservationsByMonthAndRole(User.Role.ADMIN);
            
            for (Object[] result : adminActivity) {
                Integer month = (Integer) result[0];
                Long count = (Long) result[1];
                adminCounts.put(month, count.intValue());
            }
        } catch (Exception e) {
            logger.warn("Could not get admin activity, defaulting to zero", e);
        }
        
        // Format into monthly activity DTOs
        String[] monthNames = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
        List<ReportDataDTO.MonthlyActivityDTO> monthlyActivity = new ArrayList<>();
        
        for (int i = 0; i < 12; i++) {
            int monthIndex = i + 1;
            int profCount = professorCounts.getOrDefault(monthIndex, 0);
            int studCount = studentCounts.getOrDefault(monthIndex, 0);
            int adminCount = adminCounts.getOrDefault(monthIndex, 0);
            
            monthlyActivity.add(ReportDataDTO.MonthlyActivityDTO.builder()
                    .month(monthNames[i])
                    .professorCount(profCount)
                    .studentCount(studCount)
                    .adminCount(adminCount)
                    .total(profCount + studCount + adminCount)
                    .build());
        }
        
        return monthlyActivity;
    }
    
    /**
     * Generate users by role from user data
     */
    private Map<String, Integer> generateUsersByRole() {
        logger.debug("Generating users by role from database");
        
        Map<String, Integer> usersByRole = new HashMap<>();
        
        // Count users by role
        int adminCount = userRepository.countByRole(User.Role.ADMIN);
        int professorCount = userRepository.countByRole(User.Role.PROFESSOR);
        int studentCount = userRepository.countByRole(User.Role.STUDENT);
        int totalCount = (int) userRepository.count();
        int otherCount = totalCount - adminCount - professorCount - studentCount;
        
        usersByRole.put("adminCount", adminCount);
        usersByRole.put("professorCount", professorCount);
        usersByRole.put("studentCount", studentCount);
        usersByRole.put("otherCount", otherCount);
        usersByRole.put("totalCount", totalCount);
        
        return usersByRole;
    }
    
    /**
     * Generate complete report with all data
     */
    private ReportDataDTO generateCompleteReport() {
        logger.debug("Generating complete report from database");
        
        // Generate all component reports
        DashboardStatsDTO stats = generateSystemStats();
        List<ReportDataDTO.PopularRoomDTO> popularRooms = generatePopularRooms();
        List<ReportDataDTO.ActiveUserDTO> activeUsers = generateActiveUsers();
        List<ReportDataDTO.MonthlyActivityDTO> monthlyActivity = generateMonthlyActivity();
        Map<String, Integer> usersByRole = generateUsersByRole();
        
        // Convert stats to map for the report
        Map<String, Object> statsMap = new HashMap<>();
        statsMap.put("totalReservations", stats.getActiveReservations() + stats.getPendingDemands());
        statsMap.put("approvedReservations", stats.getActiveReservations());
        statsMap.put("pendingReservations", stats.getPendingDemands());
        
        // Extract professor and student counts from the breakdown
        int professorReservations = 0;
        int studentReservations = 0;
        
        String[] parts = stats.getReservationBreakdown().split(",");
        for (String part : parts) {
            part = part.trim();
            if (part.endsWith("by professors")) {
                professorReservations = Integer.parseInt(part.substring(0, part.indexOf(" ")));
            } else if (part.endsWith("by students")) {
                studentReservations = Integer.parseInt(part.substring(0, part.indexOf(" ")));
            }
        }
        
        statsMap.put("professorReservations", professorReservations);
        statsMap.put("studentReservations", studentReservations);
        statsMap.put("totalClassrooms", stats.getTotalClassrooms());
        statsMap.put("totalUsers", stats.getTotalUsers());
        statsMap.put("usersByRole", usersByRole);
        
        // Construct complete report
        return ReportDataDTO.builder()
                .statistics(statsMap)
                .popularRooms(popularRooms)
                .activeUsers(activeUsers)
                .monthlyActivity(monthlyActivity)
                .build();
    }
    
    /**
     * Save a report to the database
     * @param reportType Type of report
     * @param reportData Data to save
     * @param reportPeriod Period of report validity
     */
    private void saveReportToDatabase(String reportType, Object reportData, String reportPeriod) {
        try {
            Report report = new Report();
            report.setReportType(reportType);
            report.setReportData(objectMapper.writeValueAsString(reportData));
            report.setGeneratedAt(new Date());
            report.setReportPeriod(reportPeriod);
            
            // Set validity based on period
            Calendar cal = Calendar.getInstance();
            switch (reportPeriod) {
                case "hourly":
                    cal.add(Calendar.HOUR, 1);
                    break;
                case "daily":
                    cal.add(Calendar.DAY_OF_MONTH, 1);
                    break;
                case "weekly":
                    cal.add(Calendar.WEEK_OF_YEAR, 1);
                    break;
                case "monthly":
                    cal.add(Calendar.MONTH, 1);
                    break;
                default:
                    cal.add(Calendar.DAY_OF_MONTH, 1);
            }
            
            report.setValidUntil(cal.getTime());
            
            // Save to database
            reportRepository.save(report);
            
            logger.debug("Saved {} report to database, valid until {}", reportType, report.getValidUntil());
        } catch (Exception e) {
            logger.error("Error saving report to database", e);
        }
    }
    
    /**
     * Generates a comprehensive report for PDF export
     * @return Formatted data for PDF report
     */
    public Map<String, Object> generatePDFReportData() {
        // Get all report data
        ReportDataDTO reportData = getCompleteReportData(false);
        
        // Format tables for PDF display
        Map<String, Object> tables = new HashMap<>();
        
        // Reservations table
        List<Map<String, Object>> reservations = new ArrayList<>();
        // Fetch recent reservations - limit to 20 for the report
        List<Reservation> recentReservations = reservationRepository.findTop10ByOrderByCreatedAtDesc();
        
        for (Reservation res : recentReservations) {
            Map<String, Object> reservation = new HashMap<>();
            reservation.put("id", res.getId());
            reservation.put("room", res.getClassroom() != null ? res.getClassroom().getRoomNumber() : "N/A");
            reservation.put("user", res.getUser().getFirstName() + " " + res.getUser().getLastName());
            reservation.put("role", res.getUser().getRole().name());
            reservation.put("date", formatDate(res.getDate()));
            reservation.put("time", res.getStartTime() + " - " + res.getEndTime());
            reservation.put("purpose", res.getPurpose());
            reservation.put("status", res.getStatus());
            reservations.add(reservation);
        }
        
        tables.put("reservations", Map.of(
            "headers", List.of("ID", "Room", "User", "Role", "Date", "Time", "Purpose", "Status"),
            "rows", reservations
        ));
        
        // Popular rooms table
        List<List<Object>> popularRoomsRows = new ArrayList<>();
        for (ReportDataDTO.PopularRoomDTO room : reportData.getPopularRooms()) {
            popularRoomsRows.add(List.of(
                room.getRoom(),
                room.getCount(),
                String.format("%.1f%%", room.getPercentage())
            ));
        }
        
        tables.put("popularRooms", Map.of(
            "headers", List.of("Room", "Reservations", "Usage Percentage"),
            "rows", popularRoomsRows
        ));
        
        // Active users table
        List<List<Object>> activeUsersRows = new ArrayList<>();
        for (ReportDataDTO.ActiveUserDTO user : reportData.getActiveUsers()) {
            activeUsersRows.add(List.of(
                user.getUserName(),
                user.getRole(),
                user.getCount()
            ));
        }
        
        tables.put("activeUsers", Map.of(
            "headers", List.of("User", "Role", "Reservations"),
            "rows", activeUsersRows
        ));
        
        // Monthly activity table
        List<List<Object>> monthlyActivityRows = new ArrayList<>();
        for (ReportDataDTO.MonthlyActivityDTO month : reportData.getMonthlyActivity()) {
            monthlyActivityRows.add(List.of(
                month.getMonth(),
                month.getProfessorCount(),
                month.getStudentCount(),
                month.getAdminCount(),
                month.getTotal()
            ));
        }
        
        tables.put("monthlyActivity", Map.of(
            "headers", List.of("Month", "Professor", "Student", "Admin", "Total"),
            "rows", monthlyActivityRows
        ));
        
        // Construct final PDF data
        Map<String, Object> pdfData = new HashMap<>();
        pdfData.put("title", "Campus Room Management System Report");
        pdfData.put("generatedAt", new Date().toString());
        pdfData.put("statistics", reportData.getStatistics());
        pdfData.put("tables", tables);
        
        return pdfData;
    }
    
    /**
     * Format date for display
     */
    private String formatDate(Date date) {
        if (date == null) return "N/A";
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return sdf.format(date);
    }
    
    /**
     * Clear the cache
     */
    public void clearCache() {
        logger.info("Clearing report cache");
        reportCache.clear();
    }
}