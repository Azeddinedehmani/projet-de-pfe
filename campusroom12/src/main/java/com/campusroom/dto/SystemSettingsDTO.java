package com.campusroom.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsDTO {
    // General Settings
    private String systemName;
    private String tagline;
    private String contactEmail;
    private String supportPhone;
    private boolean autoApproveAdmin;
    private boolean autoApproveProfessor;
    private boolean autoApproveStudent;
    
    // Email Settings (only for password reset)
    private boolean emailNotifications;
    
    // Reservation Settings
    private int maxDaysInAdvance;
    private int minTimeBeforeReservation;
    private int maxHoursPerReservation;
    private int maxReservationsPerWeek;
    private boolean studentRequireApproval;
    private boolean professorRequireApproval;
    private boolean showAvailabilityCalendar;

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public String getTagline() {
        return tagline;
    }

    public void setTagline(String tagline) {
        this.tagline = tagline;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getSupportPhone() {
        return supportPhone;
    }

    public void setSupportPhone(String supportPhone) {
        this.supportPhone = supportPhone;
    }

    public boolean isAutoApproveAdmin() {
        return autoApproveAdmin;
    }

    public void setAutoApproveAdmin(boolean autoApproveAdmin) {
        this.autoApproveAdmin = autoApproveAdmin;
    }

    public boolean isAutoApproveProfessor() {
        return autoApproveProfessor;
    }

    public void setAutoApproveProfessor(boolean autoApproveProfessor) {
        this.autoApproveProfessor = autoApproveProfessor;
    }

    public boolean isAutoApproveStudent() {
        return autoApproveStudent;
    }

    public void setAutoApproveStudent(boolean autoApproveStudent) {
        this.autoApproveStudent = autoApproveStudent;
    }

    public boolean isEmailNotifications() {
        return emailNotifications;
    }

    public void setEmailNotifications(boolean emailNotifications) {
        this.emailNotifications = emailNotifications;
    }

    public int getMaxDaysInAdvance() {
        return maxDaysInAdvance;
    }

    public void setMaxDaysInAdvance(int maxDaysInAdvance) {
        this.maxDaysInAdvance = maxDaysInAdvance;
    }

    public int getMinTimeBeforeReservation() {
        return minTimeBeforeReservation;
    }

    public void setMinTimeBeforeReservation(int minTimeBeforeReservation) {
        this.minTimeBeforeReservation = minTimeBeforeReservation;
    }

    public int getMaxHoursPerReservation() {
        return maxHoursPerReservation;
    }

    public void setMaxHoursPerReservation(int maxHoursPerReservation) {
        this.maxHoursPerReservation = maxHoursPerReservation;
    }

    public int getMaxReservationsPerWeek() {
        return maxReservationsPerWeek;
    }

    public void setMaxReservationsPerWeek(int maxReservationsPerWeek) {
        this.maxReservationsPerWeek = maxReservationsPerWeek;
    }

    public boolean isStudentRequireApproval() {
        return studentRequireApproval;
    }

    public void setStudentRequireApproval(boolean studentRequireApproval) {
        this.studentRequireApproval = studentRequireApproval;
    }

    public boolean isProfessorRequireApproval() {
        return professorRequireApproval;
    }

    public void setProfessorRequireApproval(boolean professorRequireApproval) {
        this.professorRequireApproval = professorRequireApproval;
    }

    public boolean isShowAvailabilityCalendar() {
        return showAvailabilityCalendar;
    }

    public void setShowAvailabilityCalendar(boolean showAvailabilityCalendar) {
        this.showAvailabilityCalendar = showAvailabilityCalendar;
    }
    
    // Implémentation manuelle du builder
    public static SystemSettingsDTOBuilder builder() {
        return new SystemSettingsDTOBuilder();
    }
    
    public static class SystemSettingsDTOBuilder {
        private String systemName;
        private String tagline;
        private String contactEmail;
        private String supportPhone;
        private boolean autoApproveAdmin;
        private boolean autoApproveProfessor;
        private boolean autoApproveStudent;
        private boolean emailNotifications;
        private int maxDaysInAdvance;
        private int minTimeBeforeReservation;
        private int maxHoursPerReservation;
        private int maxReservationsPerWeek;
        private boolean studentRequireApproval;
        private boolean professorRequireApproval;
        private boolean showAvailabilityCalendar;
        
        public SystemSettingsDTOBuilder systemName(String systemName) {
            this.systemName = systemName;
            return this;
        }
        
        public SystemSettingsDTOBuilder tagline(String tagline) {
            this.tagline = tagline;
            return this;
        }
        
        public SystemSettingsDTOBuilder contactEmail(String contactEmail) {
            this.contactEmail = contactEmail;
            return this;
        }
        
        public SystemSettingsDTOBuilder supportPhone(String supportPhone) {
            this.supportPhone = supportPhone;
            return this;
        }
        
        public SystemSettingsDTOBuilder autoApproveAdmin(boolean autoApproveAdmin) {
            this.autoApproveAdmin = autoApproveAdmin;
            return this;
        }
        
        public SystemSettingsDTOBuilder autoApproveProfessor(boolean autoApproveProfessor) {
            this.autoApproveProfessor = autoApproveProfessor;
            return this;
        }
        
        public SystemSettingsDTOBuilder autoApproveStudent(boolean autoApproveStudent) {
            this.autoApproveStudent = autoApproveStudent;
            return this;
        }
        
        public SystemSettingsDTOBuilder emailNotifications(boolean emailNotifications) {
            this.emailNotifications = emailNotifications;
            return this;
        }
        
        public SystemSettingsDTOBuilder maxDaysInAdvance(int maxDaysInAdvance) {
            this.maxDaysInAdvance = maxDaysInAdvance;
            return this;
        }
        
        public SystemSettingsDTOBuilder minTimeBeforeReservation(int minTimeBeforeReservation) {
            this.minTimeBeforeReservation = minTimeBeforeReservation;
            return this;
        }
        
        public SystemSettingsDTOBuilder maxHoursPerReservation(int maxHoursPerReservation) {
            this.maxHoursPerReservation = maxHoursPerReservation;
            return this;
        }
        
        public SystemSettingsDTOBuilder maxReservationsPerWeek(int maxReservationsPerWeek) {
            this.maxReservationsPerWeek = maxReservationsPerWeek;
            return this;
        }
        
        public SystemSettingsDTOBuilder studentRequireApproval(boolean studentRequireApproval) {
            this.studentRequireApproval = studentRequireApproval;
            return this;
        }
        
        public SystemSettingsDTOBuilder professorRequireApproval(boolean professorRequireApproval) {
            this.professorRequireApproval = professorRequireApproval;
            return this;
        }
        
        public SystemSettingsDTOBuilder showAvailabilityCalendar(boolean showAvailabilityCalendar) {
            this.showAvailabilityCalendar = showAvailabilityCalendar;
            return this;
        }
        
        public SystemSettingsDTO build() {
            SystemSettingsDTO dto = new SystemSettingsDTO();
            dto.setSystemName(this.systemName);
            dto.setTagline(this.tagline);
            dto.setContactEmail(this.contactEmail);
            dto.setSupportPhone(this.supportPhone);
            dto.setAutoApproveAdmin(this.autoApproveAdmin);
            dto.setAutoApproveProfessor(this.autoApproveProfessor);
            dto.setAutoApproveStudent(this.autoApproveStudent);
            dto.setEmailNotifications(this.emailNotifications);
            dto.setMaxDaysInAdvance(this.maxDaysInAdvance);
            dto.setMinTimeBeforeReservation(this.minTimeBeforeReservation);
            dto.setMaxHoursPerReservation(this.maxHoursPerReservation);
            dto.setMaxReservationsPerWeek(this.maxReservationsPerWeek);
            dto.setStudentRequireApproval(this.studentRequireApproval);
            dto.setProfessorRequireApproval(this.professorRequireApproval);
            dto.setShowAvailabilityCalendar(this.showAvailabilityCalendar);
            return dto;
        }
    }
}