package com.noteflow.controller;

import com.noteflow.dto.request.CreateFolderRequest;
import com.noteflow.dto.request.MoveFolderRequest;
import com.noteflow.dto.request.UpdateFolderRequest;
import com.noteflow.dto.response.ApiResponse;
import com.noteflow.dto.response.FolderResponse;
import com.noteflow.entity.User;
import com.noteflow.exception.ResourceNotFoundException;
import com.noteflow.repository.UserRepository;
import com.noteflow.security.CustomUserDetails;
import com.noteflow.service.FolderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;
    private final UserRepository userRepository;

    private Long getUserId(UserDetails userDetails) {
        if (userDetails instanceof CustomUserDetails customUserDetails) {
            return customUserDetails.getId();
        }
        return userRepository.findByEmail(userDetails.getUsername())
            .map(User::getId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> createFolder(
            @Valid @RequestBody CreateFolderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        FolderResponse response = folderService.createFolder(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Folder created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getRootFolders(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        List<FolderResponse> folders = folderService.getRootFolders(userId);
        return ResponseEntity.ok(ApiResponse.success(folders));
    }

    @GetMapping("/starred")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getStarredFolders(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        List<FolderResponse> folders = folderService.getStarredFolders(userId);
        return ResponseEntity.ok(ApiResponse.success(folders));
    }

    @GetMapping("/trash")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getTrashedFolders(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        List<FolderResponse> folders = folderService.getTrashedFolders(userId);
        return ResponseEntity.ok(ApiResponse.success(folders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> getFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        FolderResponse folder = folderService.getFolder(id, userId);
        return ResponseEntity.ok(ApiResponse.success(folder));
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getFolderChildren(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        List<FolderResponse> children = folderService.getFolderChildren(id, userId);
        return ResponseEntity.ok(ApiResponse.success(children));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FolderResponse>> updateFolder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFolderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        FolderResponse response = folderService.updateFolder(id, request, userId);
        return ResponseEntity.ok(ApiResponse.success("Folder updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        folderService.deleteFolder(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Folder deleted permanently", null));
    }

    @PostMapping("/{id}/trash")
    public ResponseEntity<ApiResponse<Void>> trashFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        folderService.trashFolder(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Folder moved to trash", null));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restoreFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        folderService.restoreFolder(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Folder restored successfully", null));
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<ApiResponse<Void>> moveFolder(
            @PathVariable Long id,
            @RequestBody MoveFolderRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        folderService.moveFolder(id, request.getTargetParentFolderId(), userId);
        return ResponseEntity.ok(ApiResponse.success("Folder moved successfully", null));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<FolderResponse>> duplicateFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        FolderResponse copy = folderService.duplicateFolder(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Folder duplicated successfully", copy));
    }

    @PostMapping("/{id}/star")
    public ResponseEntity<ApiResponse<Void>> starFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        folderService.starFolder(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Folder starred", null));
    }

    @DeleteMapping("/{id}/star")
    public ResponseEntity<ApiResponse<Void>> unstarFolder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        folderService.unstarFolder(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Folder unstarred", null));
    }
}
