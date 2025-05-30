package com.campusroom.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.ArrayList;

@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = "email")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    private String lastName;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    @NotBlank
    @Size(max = 120)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(length = 20)
    private String status;
    
    @Column(length = 100)
    private String department;
    
    @Column(length = 20)
    private String phone;
    
    @Column(length = 500)
    private String profileImageUrl;

    @Column(nullable = true)
    private String resetToken;

    @Column(nullable = true)
    private Date resetTokenExpiry;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false)
    private Date createdAt;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "updated_at")
    private Date updatedAt;
    
    // Add these fields to your User.java model
    private String verificationCode;
    private Date verificationCodeExpiry;

    // FIXED: Changed cascade strategy to avoid orphan removal issues
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private List<TimetableEntry> timetableEntries = new ArrayList<>();

    public enum Role {
        ADMIN, PROFESSOR, STUDENT
    }

    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        updatedAt = new Date();
        // Ensure timetable entries list is initialized
        if (timetableEntries == null) {
            timetableEntries = new ArrayList<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = new Date();
        // Ensure timetable entries list is initialized
        if (timetableEntries == null) {
            timetableEntries = new ArrayList<>();
        }
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getFirstName() {
        return firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public Role getRole() {
        return role;
    }

    public String getStatus() {
        return status;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public String getResetToken() {
        return resetToken;
    }

    public Date getResetTokenExpiry() {
        return resetTokenExpiry;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public Date getUpdatedAt() {
        return updatedAt;
    }

    public List<TimetableEntry> getTimetableEntries() {
        if (timetableEntries == null) {
            timetableEntries = new ArrayList<>();
        }
        return timetableEntries;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setStatus(String status) {
        this.status = status;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public void setResetToken(String resetToken) {
        this.resetToken = resetToken;
    }

    public void setResetTokenExpiry(Date resetTokenExpiry) {
        this.resetTokenExpiry = resetTokenExpiry;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(Date updatedAt) {
        this.updatedAt = updatedAt;
    }

    // FIXED: Safe setter that doesn't break Hibernate's collection tracking
    public void setTimetableEntries(List<TimetableEntry> timetableEntries) {
        if (this.timetableEntries == null) {
            this.timetableEntries = new ArrayList<>();
        }
        
        // Clear existing entries instead of replacing the collection
        this.timetableEntries.clear();
        
        // Add new entries if provided
        if (timetableEntries != null) {
            this.timetableEntries.addAll(timetableEntries);
        }
    }
    
    // Safe helper methods that maintain collection integrity
    public void addTimetableEntry(TimetableEntry entry) {
        if (timetableEntries == null) {
            timetableEntries = new ArrayList<>();
        }
        if (entry != null && !timetableEntries.contains(entry)) {
            timetableEntries.add(entry);
        }
    }
    
    public void removeTimetableEntry(TimetableEntry entry) {
        if (timetableEntries != null && entry != null) {
            timetableEntries.remove(entry);
        }
    }
    
    public void clearTimetableEntries() {
        if (timetableEntries != null) {
            timetableEntries.clear();
        }
    }
    
    // Add getters and setters for verification code
    public String getVerificationCode() {
        return verificationCode;
    }

    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }

    public Date getVerificationCodeExpiry() {
        return verificationCodeExpiry;
    }

    public void setVerificationCodeExpiry(Date verificationCodeExpiry) {
        this.verificationCodeExpiry = verificationCodeExpiry;
    }
}