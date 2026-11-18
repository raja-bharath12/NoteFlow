package com.noteflow.service;

import com.noteflow.entity.enums.PermissionType;
import com.noteflow.repository.DocumentPermissionRepository;
import com.noteflow.repository.DocumentRepository;
import com.noteflow.repository.FolderPermissionRepository;
import com.noteflow.repository.FolderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final DocumentPermissionRepository documentPermissionRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;

    public boolean canViewDocument(Long documentId, Long userId) {
        return documentRepository.findById(documentId)
                .map(doc -> doc.getOwnerId().equals(userId) ||
                        documentPermissionRepository.findByDocumentIdAndUserId(documentId, userId).isPresent())
                .orElse(false);
    }

    public boolean canEditDocument(Long documentId, Long userId) {
        return documentRepository.findById(documentId)
                .map(doc -> {
                    if (doc.getOwnerId().equals(userId)) return true;
                    return documentPermissionRepository.findByDocumentIdAndUserId(documentId, userId)
                            .map(p -> p.getPermission() == PermissionType.EDITOR)
                            .orElse(false);
                })
                .orElse(false);
    }

    public boolean canCommentDocument(Long documentId, Long userId) {
        return documentRepository.findById(documentId)
                .map(doc -> {
                    if (doc.getOwnerId().equals(userId)) return true;
                    return documentPermissionRepository.findByDocumentIdAndUserId(documentId, userId)
                            .map(p -> p.getPermission() == PermissionType.EDITOR || p.getPermission() == PermissionType.COMMENTER)
                            .orElse(false);
                })
                .orElse(false);
    }

    // Alias used by CommentService
    public boolean canCommentOnDocument(Long documentId, Long userId) {
        return canCommentDocument(documentId, userId);
    }


    public boolean isDocumentOwner(Long documentId, Long userId) {
        return documentRepository.findById(documentId)
                .map(doc -> doc.getOwnerId().equals(userId))
                .orElse(false);
    }

    public boolean canViewFolder(Long folderId, Long userId) {
        return folderRepository.findById(folderId)
                .map(folder -> folder.getOwnerId().equals(userId) ||
                        folderPermissionRepository.findByFolderIdAndUserId(folderId, userId).isPresent())
                .orElse(false);
    }

    public boolean canEditFolder(Long folderId, Long userId) {
        return folderRepository.findById(folderId)
                .map(folder -> {
                    if (folder.getOwnerId().equals(userId)) return true;
                    return folderPermissionRepository.findByFolderIdAndUserId(folderId, userId)
                            .map(p -> p.getPermission() == PermissionType.EDITOR)
                            .orElse(false);
                })
                .orElse(false);
    }

    public boolean isFolderOwner(Long folderId, Long userId) {
        return folderRepository.findById(folderId)
                .map(folder -> folder.getOwnerId().equals(userId))
                .orElse(false);
    }
}
