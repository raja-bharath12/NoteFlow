package com.noteflow.service;

import com.noteflow.dto.request.CreateFolderRequest;
import com.noteflow.dto.request.UpdateFolderRequest;
import com.noteflow.dto.response.FolderResponse;
import com.noteflow.entity.Folder;
import com.noteflow.entity.FolderPermission;
import com.noteflow.entity.FolderStar;
import com.noteflow.entity.FolderStarId;
import com.noteflow.entity.User;
import com.noteflow.exception.AccessDeniedException;
import com.noteflow.exception.BadRequestException;
import com.noteflow.exception.ResourceNotFoundException;
import com.noteflow.repository.DocumentRepository;
import com.noteflow.repository.FolderPermissionRepository;
import com.noteflow.repository.FolderRepository;
import com.noteflow.repository.FolderStarRepository;
import com.noteflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class FolderService {

    private final FolderRepository folderRepository;
    private final DocumentRepository documentRepository;
    private final FolderPermissionRepository folderPermissionRepository;
    private final FolderStarRepository folderStarRepository;
    private final UserRepository userRepository;
    private final PermissionService permissionService;
    private final ActivityLogService activityLogService;

    public FolderResponse createFolder(CreateFolderRequest request, Long ownerId) {
        if (request.getParentFolderId() != null) {
            Folder parent = folderRepository.findById(request.getParentFolderId())
                .orElseThrow(() -> new ResourceNotFoundException("Parent folder not found"));
            if (!permissionService.canEditFolder(parent.getId(), ownerId)) {
                throw new AccessDeniedException("You don't have permission to create in this folder");
            }
        }

        Folder folder = Folder.builder()
            .name(request.getName())
            .parentFolderId(request.getParentFolderId())
            .ownerId(ownerId)
            .color(request.getColor() != null ? request.getColor() : "#3b82f6")
            .icon(request.getIcon() != null ? request.getIcon() : "folder")
            .isStarred(false)
            .isTrashed(false)
            .build();

        folder = folderRepository.save(folder);
        activityLogService.log(ownerId, "CREATE_FOLDER", "FOLDER", folder.getId());
        return mapToResponse(folder, ownerId);
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> getRootFolders(Long userId) {
        List<Folder> owned = folderRepository.findByParentFolderIdIsNullAndOwnerIdAndIsTrashedFalse(userId);
        // Also get shared folders at root level where user has access
        List<FolderPermission> sharedPerms = folderPermissionRepository.findByUserId(userId);
        List<Folder> sharedFolders = sharedPerms.stream()
            .map(p -> folderRepository.findById(p.getFolderId()).orElse(null))
            .filter(f -> f != null && !f.isTrashed() && f.getParentFolderId() == null)
            .collect(Collectors.toList());

        List<Folder> all = new ArrayList<>(owned);
        sharedFolders.stream().filter(f -> owned.stream().noneMatch(o -> o.getId().equals(f.getId()))).forEach(all::add);

        return all.stream().map(f -> mapToResponse(f, userId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> getFolderChildren(Long parentId, Long userId) {
        if (!permissionService.canViewFolder(parentId, userId)) {
            throw new AccessDeniedException("Access denied");
        }
        List<Folder> folders = folderRepository.findByParentFolderIdAndOwnerIdAndIsTrashedFalse(parentId, userId);
        return folders.stream().map(f -> mapToResponse(f, userId)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FolderResponse getFolder(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.canViewFolder(folderId, userId)) {
            throw new AccessDeniedException("Access denied");
        }
        return mapToResponse(folder, userId);
    }

    public FolderResponse updateFolder(Long folderId, UpdateFolderRequest request, Long userId) {
        Folder folder = folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.canEditFolder(folderId, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        if (request.getName() != null) folder.setName(request.getName());
        if (request.getColor() != null) folder.setColor(request.getColor());
        if (request.getIcon() != null) folder.setIcon(request.getIcon());
        if (request.getIsStarred() != null) folder.setStarred(request.getIsStarred());
        if (request.getParentFolderId() != null) folder.setParentFolderId(request.getParentFolderId());

        folder = folderRepository.save(folder);
        activityLogService.log(userId, "UPDATE_FOLDER", "FOLDER", folder.getId());
        return mapToResponse(folder, userId);
    }

    public void moveFolder(Long folderId, Long targetParentId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.isFolderOwner(folderId, userId)) {
            throw new AccessDeniedException("Only the owner can move folders");
        }

        // Prevent circular nesting
        if (targetParentId != null) {
            if (targetParentId.equals(folderId)) throw new BadRequestException("Cannot move folder into itself");
            if (isAncestor(folderId, targetParentId)) throw new BadRequestException("Cannot move folder into its own subfolder");
        }

        folder.setParentFolderId(targetParentId);
        folderRepository.save(folder);
        activityLogService.log(userId, "MOVE_FOLDER", "FOLDER", folderId);
    }

    private boolean isAncestor(Long ancestorId, Long descendantId) {
        Folder current = folderRepository.findById(descendantId).orElse(null);
        while (current != null && current.getParentFolderId() != null) {
            if (current.getParentFolderId().equals(ancestorId)) return true;
            current = folderRepository.findById(current.getParentFolderId()).orElse(null);
        }
        return false;
    }

    public FolderResponse duplicateFolder(Long folderId, Long userId) {
        Folder original = folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.canViewFolder(folderId, userId)) {
            throw new AccessDeniedException("Access denied");
        }

        Folder copy = Folder.builder()
            .name(original.getName() + " (Copy)")
            .parentFolderId(original.getParentFolderId())
            .ownerId(userId)
            .color(original.getColor())
            .icon(original.getIcon())
            .isStarred(false)
            .isTrashed(false)
            .build();

        copy = folderRepository.save(copy);
        activityLogService.log(userId, "DUPLICATE_FOLDER", "FOLDER", folderId);
        return mapToResponse(copy, userId);
    }

    public void deleteFolder(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.isFolderOwner(folderId, userId)) {
            throw new AccessDeniedException("Only the owner can delete folders");
        }
        folderRepository.delete(folder);
        activityLogService.log(userId, "DELETE_FOLDER", "FOLDER", folderId);
    }

    public void trashFolder(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.isFolderOwner(folderId, userId)) {
            throw new AccessDeniedException("Only the owner can trash folders");
        }
        folder.setTrashed(true);
        folder.setTrashedAt(LocalDateTime.now());
        folderRepository.save(folder);
        activityLogService.log(userId, "TRASH_FOLDER", "FOLDER", folderId);
    }

    public void restoreFolder(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.isFolderOwner(folderId, userId)) {
            throw new AccessDeniedException("Only the owner can restore folders");
        }
        folder.setTrashed(false);
        folder.setTrashedAt(null);
        folderRepository.save(folder);
        activityLogService.log(userId, "RESTORE_FOLDER", "FOLDER", folderId);
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> getTrashedFolders(Long userId) {
        return folderRepository.findByOwnerIdAndIsTrashedTrue(userId).stream()
            .map(f -> mapToResponse(f, userId)).collect(Collectors.toList());
    }

    public void starFolder(Long folderId, Long userId) {
        folderRepository.findById(folderId)
            .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        if (!permissionService.canViewFolder(folderId, userId)) throw new AccessDeniedException("Access denied");
        if (!folderStarRepository.existsByIdUserIdAndIdFolderId(userId, folderId)) {
            FolderStarId starId = new FolderStarId(userId, folderId);
            FolderStar star = FolderStar.builder().id(starId).build();
            folderStarRepository.save(star);
        }
    }

    public void unstarFolder(Long folderId, Long userId) {
        FolderStarId starId = new FolderStarId(userId, folderId);
        folderStarRepository.deleteById(starId);
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> getStarredFolders(Long userId) {
        return folderStarRepository.findByIdUserId(userId).stream()
            .map(star -> folderRepository.findById(star.getId().getFolderId()).orElse(null))
            .filter(Objects::nonNull)
            .map(f -> mapToResponse(f, userId))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> searchFolders(String query, Long userId) {
        return folderRepository.searchByName(query, userId).stream()
            .map(f -> mapToResponse(f, userId)).collect(Collectors.toList());
    }

    private FolderResponse mapToResponse(Folder folder, Long currentUserId) {
        User owner = userRepository.findById(folder.getOwnerId()).orElse(null);
        int docCount = documentRepository.findByFolderIdAndIsTrashedFalse(folder.getId()).size();
        int subfolderCount = folderRepository.findByParentFolderIdAndOwnerIdAndIsTrashedFalse(folder.getId(), folder.getOwnerId()).size();
        boolean starred = folderStarRepository.existsByIdUserIdAndIdFolderId(currentUserId, folder.getId());

        return FolderResponse.builder()
            .id(folder.getId())
            .name(folder.getName())
            .parentFolderId(folder.getParentFolderId())
            .ownerId(folder.getOwnerId())
            .ownerName(owner != null ? owner.getUsername() : "Unknown")
            .color(folder.getColor())
            .icon(folder.getIcon())
            .isStarred(starred)
            .isTrashed(folder.isTrashed())
            .trashedAt(folder.getTrashedAt())
            .createdAt(folder.getCreatedAt())
            .updatedAt(folder.getUpdatedAt())
            .documentCount(docCount)
            .subfolderCount(subfolderCount)
            .build();
    }
}
