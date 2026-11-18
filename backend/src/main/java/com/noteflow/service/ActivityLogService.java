package com.noteflow.service;

import com.noteflow.entity.ActivityLog;
import com.noteflow.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Async
    public void log(Long userId, String action, String resourceType, Long resourceId) {
        ActivityLog log = ActivityLog.builder()
                .userId(userId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .build();
        activityLogRepository.save(log);
    }

    @Async
    public void log(Long userId, String action, String resourceType, Long resourceId, String metadata) {
        ActivityLog log = ActivityLog.builder()
                .userId(userId)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .metadata(metadata)
                .build();
        activityLogRepository.save(log);
    }

    public List<ActivityLog> getUserActivity(Long userId) {
        return activityLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
