package com.noteflow.repository;

import com.noteflow.entity.ActivityLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    List<ActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT a FROM ActivityLog a WHERE a.userId = :userId ORDER BY a.createdAt DESC")
    List<ActivityLog> findRecentByUserId(@Param("userId") Long userId, Pageable pageable);
}
