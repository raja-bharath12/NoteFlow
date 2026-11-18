package com.noteflow.service;

import com.noteflow.entity.Document;
import com.noteflow.entity.Folder;
import com.noteflow.repository.ActivityLogRepository;
import com.noteflow.repository.CommentRepository;
import com.noteflow.repository.DocumentRepository;
import com.noteflow.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;
    private final ActivityLogRepository activityLogRepository;
    private final CommentRepository commentRepository;

    public Map<String, Object> getDashboardStats(Long userId) {
        Map<String, Object> stats = new HashMap<>();
        long totalDocuments = documentRepository.countByOwnerIdAndIsTrashedFalse(userId);
        long totalFolders = folderRepository.countByOwnerIdAndIsTrashedFalse(userId);
        long starredDocuments = documentRepository.countByOwnerIdAndIsStarredTrueAndIsTrashedFalse(userId);

        stats.put("totalDocuments", totalDocuments);
        stats.put("totalFolders", totalFolders);
        stats.put("starredDocuments", starredDocuments);
        return stats;
    }

    public List<Document> getRecentDocuments(Long userId) {
        return documentRepository.findRecentByOwnerId(userId, PageRequest.of(0, 10));
    }

    public Map<String, Object> getStarredItems(Long userId) {
        Map<String, Object> starred = new HashMap<>();
        starred.put("documents", documentRepository.findByOwnerIdAndIsStarredTrueAndIsTrashedFalse(userId));
        starred.put("folders", folderRepository.findByOwnerIdAndIsStarredTrueAndIsTrashedFalse(userId));
        return starred;
    }

    public Object getRecentActivity(Long userId) {
        return activityLogRepository.findRecentByUserId(userId, PageRequest.of(0, 20));
    }
}
