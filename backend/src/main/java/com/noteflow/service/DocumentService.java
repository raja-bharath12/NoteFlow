package com.noteflow.service;

import com.noteflow.dto.request.CreateDocumentRequest;
import com.noteflow.dto.request.UpdateDocumentRequest;
import com.noteflow.dto.response.DocumentResponse;
import com.noteflow.dto.response.DocumentVersionResponse;
import com.noteflow.entity.*;
import com.noteflow.exception.AccessDeniedException;
import com.noteflow.exception.BadRequestException;
import com.noteflow.exception.ResourceNotFoundException;
import com.noteflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;
    private final UserRepository userRepository;
    private final DocumentPermissionRepository documentPermissionRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final DocumentStarRepository documentStarRepository;
    private final DocumentVersionRepository documentVersionRepository;
    private final CommentRepository commentRepository;
    private final PermissionService permissionService;
    private final ActivityLogService activityLogService;

    public DocumentResponse createDocument(CreateDocumentRequest request, Long ownerId) {
        if (request.getFolderId() != null) {
            Folder folder = folderRepository.findById(request.getFolderId())
                .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
            if (!permissionService.canEditFolder(folder.getId(), ownerId)) {
                throw new AccessDeniedException("You don't have permission to create documents in this folder");
            }
        }

        String title = (request.getTitle() != null && !request.getTitle().isBlank())
            ? request.getTitle().trim()
            : "Untitled";

        int wordCount = calculateWordCount(request.getContent());

        Document document = Document.builder()
            .title(title)
            .content(request.getContent())
            .folderId(request.getFolderId())
            .ownerId(ownerId)
            .wordCount(wordCount)
            .isStarred(false)
            .isTrashed(false)
            .lastOpenedAt(LocalDateTime.now())
            .build();

        document = documentRepository.save(document);

        // Auto-create initial version 1
        DocumentVersion initialVersion = DocumentVersion.builder()
            .documentId(document.getId())
            .title(document.getTitle())
            .content(document.getContent())
            .versionNumber(1)
            .wordCount(wordCount)
            .createdBy(ownerId)
            .build();
        documentVersionRepository.save(initialVersion);

        activityLogService.log(ownerId, "CREATE_DOCUMENT", "DOCUMENT", document.getId());
        return mapToResponse(document, ownerId);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        if (!checkCanView(document, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        return mapToResponse(document, userId);
    }

    public void updateLastOpened(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        if (!checkCanView(document, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        document.setLastOpenedAt(LocalDateTime.now());
        documentRepository.save(document);
    }

    public DocumentResponse updateDocument(Long documentId, UpdateDocumentRequest request, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        if (!checkCanEdit(document, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        // Auto-versioning: when content changes, create a new version and prune to keep last 50 versions
        boolean contentChanged = request.getContent() != null && !Objects.equals(request.getContent(), document.getContent());
        if (contentChanged) {
            int nextVersion = documentVersionRepository.findTopByDocumentIdOrderByVersionNumberDesc(documentId)
                .map(v -> v.getVersionNumber() + 1)
                .orElse(1);

            int versionWordCount = request.getWordCount() != null
                ? request.getWordCount()
                : calculateWordCount(request.getContent());

            DocumentVersion version = DocumentVersion.builder()
                .documentId(documentId)
                .title(request.getTitle() != null ? request.getTitle() : document.getTitle())
                .content(request.getContent())
                .versionNumber(nextVersion)
                .wordCount(versionWordCount)
                .createdBy(userId)
                .build();
            documentVersionRepository.save(version);

            // Keep only the latest 50 versions per document
            List<DocumentVersion> allVersions = documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId);
            if (allVersions.size() > 50) {
                List<DocumentVersion> oldVersions = allVersions.subList(50, allVersions.size());
                documentVersionRepository.deleteAll(oldVersions);
            }
        }

        if (request.getTitle() != null) {
            document.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            document.setContent(request.getContent());
            document.setWordCount(request.getWordCount() != null ? request.getWordCount() : calculateWordCount(request.getContent()));
        }
        if (request.getFolderId() != null) {
            Folder folder = folderRepository.findById(request.getFolderId())
                .orElseThrow(() -> new ResourceNotFoundException("Target folder not found"));
            if (!permissionService.canEditFolder(folder.getId(), userId)) {
                throw new AccessDeniedException("You don't have permission for target folder");
            }
            document.setFolderId(request.getFolderId());
        }
        if (request.getIsStarred() != null) {
            document.setStarred(request.getIsStarred());
        }

        document = documentRepository.save(document);
        activityLogService.log(userId, "UPDATE_DOCUMENT", "DOCUMENT", document.getId());
        return mapToResponse(document, userId);
    }

    public void deleteDocument(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!permissionService.isDocumentOwner(documentId, userId)) {
            throw new AccessDeniedException("Only the owner can delete documents");
        }
        documentRepository.delete(document);
        activityLogService.log(userId, "DELETE_DOCUMENT", "DOCUMENT", documentId);
    }

    public void trashDocument(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!permissionService.isDocumentOwner(documentId, userId)) {
            throw new AccessDeniedException("Only the owner can trash documents");
        }
        document.setTrashed(true);
        document.setTrashedAt(LocalDateTime.now());
        documentRepository.save(document);
        activityLogService.log(userId, "TRASH_DOCUMENT", "DOCUMENT", documentId);
    }

    public void restoreDocument(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!permissionService.isDocumentOwner(documentId, userId)) {
            throw new AccessDeniedException("Only the owner can restore documents");
        }
        document.setTrashed(false);
        document.setTrashedAt(null);
        documentRepository.save(document);
        activityLogService.log(userId, "RESTORE_DOCUMENT", "DOCUMENT", documentId);
    }

    public DocumentResponse duplicateDocument(Long documentId, Long userId) {
        Document original = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!checkCanView(original, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        Document copy = Document.builder()
            .title(original.getTitle() + " (Copy)")
            .content(original.getContent())
            .folderId(original.getFolderId())
            .ownerId(userId)
            .wordCount(original.getWordCount())
            .isStarred(false)
            .isTrashed(false)
            .lastOpenedAt(LocalDateTime.now())
            .build();

        copy = documentRepository.save(copy);

        DocumentVersion copyVersion = DocumentVersion.builder()
            .documentId(copy.getId())
            .title(copy.getTitle())
            .content(copy.getContent())
            .versionNumber(1)
            .wordCount(copy.getWordCount())
            .createdBy(userId)
            .build();
        documentVersionRepository.save(copyVersion);

        activityLogService.log(userId, "DUPLICATE_DOCUMENT", "DOCUMENT", documentId);
        return mapToResponse(copy, userId);
    }

    public void moveDocument(Long documentId, Long targetFolderId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!permissionService.isDocumentOwner(documentId, userId)) {
            throw new AccessDeniedException("Only the owner can move documents");
        }

        if (targetFolderId != null) {
            Folder targetFolder = folderRepository.findById(targetFolderId)
                .orElseThrow(() -> new ResourceNotFoundException("Target folder not found"));
            if (!permissionService.canEditFolder(targetFolder.getId(), userId)) {
                throw new AccessDeniedException("You don't have permission for target folder");
            }
        }

        document.setFolderId(targetFolderId);
        documentRepository.save(document);
        activityLogService.log(userId, "MOVE_DOCUMENT", "DOCUMENT", documentId);
    }

    public void starDocument(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!checkCanView(document, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        if (!documentStarRepository.existsByIdUserIdAndIdDocumentId(userId, documentId)) {
            DocumentStarId starId = new DocumentStarId(userId, documentId);
            DocumentStar star = DocumentStar.builder().id(starId).build();
            documentStarRepository.save(star);
        }
    }

    public void unstarDocument(Long documentId, Long userId) {
        DocumentStarId starId = new DocumentStarId(userId, documentId);
        documentStarRepository.deleteById(starId);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getStarredDocuments(Long userId) {
        return documentStarRepository.findByIdUserId(userId).stream()
            .map(star -> documentRepository.findById(star.getId().getDocumentId()).orElse(null))
            .filter(doc -> doc != null && !doc.isTrashed())
            .map(doc -> mapToResponse(doc, userId))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsByFolder(Long folderId, Long userId) {
        if (!permissionService.canViewFolder(folderId, userId)) {
            throw new AccessDeniedException("Access denied");
        }
        return documentRepository.findByFolderIdAndIsTrashedFalse(folderId).stream()
            .map(doc -> mapToResponse(doc, userId))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getRecentDocuments(Long userId) {
        return documentRepository.findByOwnerIdAndIsTrashedFalseOrderByLastOpenedAtDesc(userId).stream()
            .limit(20)
            .map(doc -> mapToResponse(doc, userId))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getTrashedDocuments(Long userId) {
        return documentRepository.findByOwnerIdAndIsTrashedTrue(userId).stream()
            .map(doc -> mapToResponse(doc, userId))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentVersionResponse> getVersions(Long documentId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!checkCanView(document, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        return documentVersionRepository.findByDocumentIdOrderByVersionNumberDesc(documentId).stream()
            .map(this::mapVersionToResponse)
            .collect(Collectors.toList());
    }

    public DocumentResponse restoreVersion(Long documentId, Long versionId, Long userId) {
        Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        if (!checkCanEdit(document, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        DocumentVersion version = documentVersionRepository.findById(versionId)
            .orElseThrow(() -> new ResourceNotFoundException("Version not found"));

        if (!version.getDocumentId().equals(documentId)) {
            throw new BadRequestException("Version does not belong to this document");
        }

        document.setContent(version.getContent());
        if (version.getTitle() != null && !version.getTitle().isBlank()) {
            document.setTitle(version.getTitle());
        }
        document.setWordCount(version.getWordCount());

        int nextVersion = documentVersionRepository.findTopByDocumentIdOrderByVersionNumberDesc(documentId)
            .map(v -> v.getVersionNumber() + 1)
            .orElse(1);

        DocumentVersion restoredVersion = DocumentVersion.builder()
            .documentId(documentId)
            .title(document.getTitle())
            .content(document.getContent())
            .versionNumber(nextVersion)
            .wordCount(document.getWordCount())
            .createdBy(userId)
            .build();
        documentVersionRepository.save(restoredVersion);

        document = documentRepository.save(document);
        activityLogService.log(userId, "RESTORE_DOCUMENT_VERSION", "DOCUMENT", documentId);
        return mapToResponse(document, userId);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> searchDocuments(String query, Long userId) {
        return documentRepository.searchByTitleOrContent(query, userId).stream()
            .map(doc -> mapToResponse(doc, userId))
            .collect(Collectors.toList());
    }

    public boolean checkCanView(Document doc, Long userId) {
        if (doc.getOwnerId().equals(userId)) return true;
        if (documentPermissionRepository.findByDocumentIdAndUserId(doc.getId(), userId).isPresent()) return true;
        if (doc.getFolderId() != null && permissionService.canViewFolder(doc.getFolderId(), userId)) return true;
        return false;
    }

    public boolean checkCanEdit(Document doc, Long userId) {
        if (doc.getOwnerId().equals(userId)) return true;
        if (permissionService.canEditDocument(doc.getId(), userId)) return true;
        if (doc.getFolderId() != null && permissionService.canEditFolder(doc.getFolderId(), userId)) return true;
        return false;
    }

    private String resolveUserPermission(Document document, Long userId) {
        if (document.getOwnerId().equals(userId)) {
            return "OWNER";
        }
        Optional<DocumentPermission> docPerm = documentPermissionRepository.findByDocumentIdAndUserId(document.getId(), userId);
        if (docPerm.isPresent()) {
            return docPerm.get().getPermission().name();
        }
        if (document.getFolderId() != null) {
            if (permissionService.isFolderOwner(document.getFolderId(), userId)) {
                return "OWNER";
            }
            Optional<FolderPermission> folderPerm = folderPermissionRepository.findByFolderIdAndUserId(document.getFolderId(), userId);
            if (folderPerm.isPresent()) {
                return folderPerm.get().getPermission().name();
            }
        }
        return "VIEWER";
    }

    private DocumentResponse mapToResponse(Document doc, Long currentUserId) {
        User owner = userRepository.findById(doc.getOwnerId()).orElse(null);
        String folderName = null;
        if (doc.getFolderId() != null) {
            folderName = folderRepository.findById(doc.getFolderId()).map(Folder::getName).orElse(null);
        }
        boolean starred = documentStarRepository.existsByIdUserIdAndIdDocumentId(currentUserId, doc.getId());
        int versionCount = (int) documentVersionRepository.countByDocumentId(doc.getId());
        int commentCount = (int) commentRepository.countByDocumentId(doc.getId());
        String permission = resolveUserPermission(doc, currentUserId);

        return DocumentResponse.builder()
            .id(doc.getId())
            .title(doc.getTitle())
            .content(doc.getContent())
            .folderId(doc.getFolderId())
            .folderName(folderName)
            .ownerId(doc.getOwnerId())
            .ownerName(owner != null ? owner.getUsername() : "Unknown")
            .isStarred(starred)
            .isTrashed(doc.isTrashed())
            .wordCount(doc.getWordCount() != null ? doc.getWordCount() : 0)
            .lastOpenedAt(doc.getLastOpenedAt())
            .createdAt(doc.getCreatedAt())
            .updatedAt(doc.getUpdatedAt())
            .currentUserPermission(permission)
            .versionCount(versionCount)
            .commentCount(commentCount)
            .build();
    }

    private DocumentVersionResponse mapVersionToResponse(DocumentVersion version) {
        User creator = userRepository.findById(version.getCreatedBy()).orElse(null);
        return DocumentVersionResponse.builder()
            .id(version.getId())
            .documentId(version.getDocumentId())
            .title(version.getTitle())
            .content(version.getContent())
            .versionNumber(version.getVersionNumber())
            .wordCount(version.getWordCount() != null ? version.getWordCount() : 0)
            .createdBy(version.getCreatedBy())
            .creatorName(creator != null ? creator.getUsername() : "Unknown")
            .createdAt(version.getCreatedAt())
            .build();
    }

    private int calculateWordCount(String content) {
        if (content == null || content.isBlank()) {
            return 0;
        }
        String plainText = content.replaceAll("<[^>]*>", " ").trim();
        if (plainText.isEmpty()) {
            return 0;
        }
        String[] words = plainText.split("\\s+");
        return words.length;
    }
}
