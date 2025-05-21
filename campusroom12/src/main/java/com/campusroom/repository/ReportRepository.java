package com.campusroom.repository;

import com.campusroom.model.Report;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    // Find the most recent report of a specific type
    Optional<Report> findFirstByReportTypeOrderByGeneratedAtDesc(String reportType);
    
    // Find reports by type and period
    List<Report> findByReportTypeAndReportPeriodOrderByGeneratedAtDesc(String reportType, String reportPeriod, Pageable pageable);
    
    // Find valid (non-expired) reports
    @Query("SELECT r FROM Report r WHERE r.reportType = :reportType AND (r.validUntil IS NULL OR r.validUntil > :currentDate) ORDER BY r.generatedAt DESC")
    Optional<Report> findValidReport(@Param("reportType") String reportType, @Param("currentDate") Date currentDate);
    
    // Find reports generated within a specific date range
    List<Report> findByReportTypeAndGeneratedAtBetween(String reportType, Date startDate, Date endDate);
    
    // Delete old reports to prevent database bloat
    @Query("DELETE FROM Report r WHERE r.generatedAt < :cutoffDate")
    void deleteOldReports(@Param("cutoffDate") Date cutoffDate);
}