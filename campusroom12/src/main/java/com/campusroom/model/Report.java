package com.campusroom.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String reportType;
    
    @Column(nullable = false)
    @Lob
    private String reportData;
    
    @Column(nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date generatedAt;
    
    @Column(name = "report_period")
    private String reportPeriod;
    
    @Column(name = "valid_until")
    @Temporal(TemporalType.TIMESTAMP)
    private Date validUntil;
    
    // Default constructor needed by JPA
    public Report() {
    }
    
    // Constructor used in ReportService for new reports
    public Report(String reportType, String reportData, Date generatedAt, String reportPeriod, Date validUntil) {
        this.reportType = reportType;
        this.reportData = reportData;
        this.generatedAt = generatedAt;
        this.reportPeriod = reportPeriod;
        this.validUntil = validUntil;
    }
    
    // Used for existing reports
    public Report(Long id, String reportType, String reportData, Date generatedAt, String reportPeriod, Date validUntil) {
        this.id = id;
        this.reportType = reportType;
        this.reportData = reportData;
        this.generatedAt = generatedAt;
        this.reportPeriod = reportPeriod;
        this.validUntil = validUntil;
    }
    
    @Transient
    public boolean isStale() {
        return validUntil != null && validUntil.before(new Date());
    }
    
    // Standard getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getReportData() {
        return reportData;
    }

    public void setReportData(String reportData) {
        this.reportData = reportData;
    }

    public Date getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Date generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getReportPeriod() {
        return reportPeriod;
    }

    public void setReportPeriod(String reportPeriod) {
        this.reportPeriod = reportPeriod;
    }

    public Date getValidUntil() {
        return validUntil;
    }

    public void setValidUntil(Date validUntil) {
        this.validUntil = validUntil;
    }
}