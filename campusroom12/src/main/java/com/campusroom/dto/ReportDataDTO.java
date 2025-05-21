package com.campusroom.dto;

import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ReportDataDTO {
    private Map<String, Object> statistics;
    private List<PopularRoomDTO> popularRooms;
    private List<ActiveUserDTO> activeUsers;
    private List<MonthlyActivityDTO> monthlyActivity;

    // Constructor
    public ReportDataDTO(Map<String, Object> statistics, List<PopularRoomDTO> popularRooms, 
                         List<ActiveUserDTO> activeUsers, List<MonthlyActivityDTO> monthlyActivity) {
        this.statistics = statistics;
        this.popularRooms = popularRooms;
        this.activeUsers = activeUsers;
        this.monthlyActivity = monthlyActivity;
    }

    // Explicit getters and setters
    public Map<String, Object> getStatistics() {
        return statistics;
    }

    public void setStatistics(Map<String, Object> statistics) {
        this.statistics = statistics;
    }

    public List<PopularRoomDTO> getPopularRooms() {
        return popularRooms;
    }

    public void setPopularRooms(List<PopularRoomDTO> popularRooms) {
        this.popularRooms = popularRooms;
    }

    public List<ActiveUserDTO> getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(List<ActiveUserDTO> activeUsers) {
        this.activeUsers = activeUsers;
    }

    public List<MonthlyActivityDTO> getMonthlyActivity() {
        return monthlyActivity;
    }

    public void setMonthlyActivity(List<MonthlyActivityDTO> monthlyActivity) {
        this.monthlyActivity = monthlyActivity;
    }

    public static ReportDataDTOBuilder builder() {
        return new ReportDataDTOBuilder();
    }

    // Builder class
    public static class ReportDataDTOBuilder {
        private Map<String, Object> statistics;
        private List<PopularRoomDTO> popularRooms;
        private List<ActiveUserDTO> activeUsers;
        private List<MonthlyActivityDTO> monthlyActivity;

        public ReportDataDTOBuilder statistics(Map<String, Object> statistics) {
            this.statistics = statistics;
            return this;
        }

        public ReportDataDTOBuilder popularRooms(List<PopularRoomDTO> popularRooms) {
            this.popularRooms = popularRooms;
            return this;
        }

        public ReportDataDTOBuilder activeUsers(List<ActiveUserDTO> activeUsers) {
            this.activeUsers = activeUsers;
            return this;
        }

        public ReportDataDTOBuilder monthlyActivity(List<MonthlyActivityDTO> monthlyActivity) {
            this.monthlyActivity = monthlyActivity;
            return this;
        }

        public ReportDataDTO build() {
            return new ReportDataDTO(statistics, popularRooms, activeUsers, monthlyActivity);
        }
    }

    @Data
    @NoArgsConstructor
    public static class PopularRoomDTO {
        private String room;
        private long count;
        private double percentage;

        // Constructor
        public PopularRoomDTO(String room, long count, double percentage) {
            this.room = room;
            this.count = count;
            this.percentage = percentage;
        }

        // Explicit getters and setters
        public String getRoom() {
            return room;
        }

        public void setRoom(String room) {
            this.room = room;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }

        public double getPercentage() {
            return percentage;
        }

        public void setPercentage(double percentage) {
            this.percentage = percentage;
        }

        public static PopularRoomDTOBuilder builder() {
            return new PopularRoomDTOBuilder();
        }

        public static class PopularRoomDTOBuilder {
            private String room;
            private long count;
            private double percentage;

            public PopularRoomDTOBuilder room(String room) {
                this.room = room;
                return this;
            }

            public PopularRoomDTOBuilder count(long count) {
                this.count = count;
                return this;
            }

            public PopularRoomDTOBuilder percentage(double percentage) {
                this.percentage = percentage;
                return this;
            }

            public PopularRoomDTO build() {
                return new PopularRoomDTO(room, count, percentage);
            }
        }
    }

    @Data
    @NoArgsConstructor
    public static class ActiveUserDTO {
        private String userId;
        private String userName;
        private String role;
        private long count;

        // Constructor
        public ActiveUserDTO(String userId, String userName, String role, long count) {
            this.userId = userId;
            this.userName = userName;
            this.role = role;
            this.count = count;
        }

        // Explicit getters and setters
        public String getUserId() {
            return userId;
        }

        public void setUserId(String userId) {
            this.userId = userId;
        }

        public String getUserName() {
            return userName;
        }

        public void setUserName(String userName) {
            this.userName = userName;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }

        public static ActiveUserDTOBuilder builder() {
            return new ActiveUserDTOBuilder();
        }

        public static class ActiveUserDTOBuilder {
            private String userId;
            private String userName;
            private String role;
            private long count;

            public ActiveUserDTOBuilder userId(String userId) {
                this.userId = userId;
                return this;
            }

            public ActiveUserDTOBuilder userName(String userName) {
                this.userName = userName;
                return this;
            }

            public ActiveUserDTOBuilder role(String role) {
                this.role = role;
                return this;
            }

            public ActiveUserDTOBuilder count(long count) {
                this.count = count;
                return this;
            }

            public ActiveUserDTO build() {
                return new ActiveUserDTO(userId, userName, role, count);
            }
        }
    }

    @Data
    @NoArgsConstructor
    public static class MonthlyActivityDTO {
        private String month;
        private int professorCount;
        private int studentCount;
        private int adminCount;
        private int total;

        // Updated constructor with adminCount
        public MonthlyActivityDTO(String month, int professorCount, int studentCount, int adminCount, int total) {
            this.month = month;
            this.professorCount = professorCount;
            this.studentCount = studentCount;
            this.adminCount = adminCount;
            this.total = total;
        }

        // Explicit getters and setters
        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public int getProfessorCount() {
            return professorCount;
        }

        public void setProfessorCount(int professorCount) {
            this.professorCount = professorCount;
        }

        public int getStudentCount() {
            return studentCount;
        }

        public void setStudentCount(int studentCount) {
            this.studentCount = studentCount;
        }

        public int getAdminCount() {
            return adminCount;
        }

        public void setAdminCount(int adminCount) {
            this.adminCount = adminCount;
        }

        public int getTotal() {
            return total;
        }

        public void setTotal(int total) {
            this.total = total;
        }

        public static MonthlyActivityDTOBuilder builder() {
            return new MonthlyActivityDTOBuilder();
        }

        public static class MonthlyActivityDTOBuilder {
            private String month;
            private int professorCount;
            private int studentCount;
            private int adminCount;
            private int total;

            public MonthlyActivityDTOBuilder month(String month) {
                this.month = month;
                return this;
            }

            public MonthlyActivityDTOBuilder professorCount(int professorCount) {
                this.professorCount = professorCount;
                return this;
            }

            public MonthlyActivityDTOBuilder studentCount(int studentCount) {
                this.studentCount = studentCount;
                return this;
            }

            public MonthlyActivityDTOBuilder adminCount(int adminCount) {
                this.adminCount = adminCount;
                return this;
            }

            public MonthlyActivityDTOBuilder total(int total) {
                this.total = total;
                return this;
            }

            public MonthlyActivityDTO build() {
                return new MonthlyActivityDTO(month, professorCount, studentCount, adminCount, total);
            }
        }
    }
}