package com.noteflow.controller;

import com.noteflow.dto.request.CreateDocumentRequest;
import com.noteflow.dto.request.UpdateDocumentRequest;
import com.noteflow.dto.response.ApiResponse;
import com.noteflow.repository.UserRepository;
import com.noteflow.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final UserRepository userRepository;

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createDocument(
            @RequestBody CreateDocumentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long ownerId = getUserId(userDetails);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document created", documentService.createDocument(request, ownerId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocument(id, getUserId(userDetails))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateDocument(
            @PathVariable Long id,
            @RequestBody UpdateDocumentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Document updated",
                documentService.updateDocument(id, request, getUserId(userDetails))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.deleteDocument(id, getUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success("Document deleted", null));
    }

    @GetMapping("/folder/{folderId}")
    public ResponseEntity<ApiResponse<?>> getDocumentsByFolder(
            @PathVariable Long folderId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentsByFolder(folderId, getUserId(userDetails))));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<?>> getRecentDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getRecentDocuments(getUserId(userDetails))));
    }

    @GetMapping("/starred")
    public ResponseEntity<ApiResponse<?>> getStarredDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getStarredDocuments(getUserId(userDetails))));
    }

    @GetMapping("/trash")
    public ResponseEntity<ApiResponse<?>> getTrashedDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getTrashedDocuments(getUserId(userDetails))));
    }

    @PostMapping("/{id}/star")
    public ResponseEntity<ApiResponse<Void>> starDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.starDocument(id, getUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success("Document starred", null));
    }

    @DeleteMapping("/{id}/star")
    public ResponseEntity<ApiResponse<Void>> unstarDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.unstarDocument(id, getUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success("Document unstarred", null));
    }

    @PostMapping("/{id}/trash")
    public ResponseEntity<ApiResponse<Void>> trashDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.trashDocument(id, getUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success("Moved to trash", null));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<Void>> restoreDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        documentService.restoreDocument(id, getUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success("Document restored", null));
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<?>> duplicateDocument(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.duplicateDocument(id, getUserId(userDetails))));
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<ApiResponse<Void>> moveDocument(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long folderId = body.get("folderId") != null ? Long.parseLong(body.get("folderId").toString()) : null;
        documentService.moveDocument(id, folderId, getUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success("Document moved", null));
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<ApiResponse<?>> getVersions(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getVersions(id, getUserId(userDetails))));
    }

    @PostMapping("/{id}/versions/{versionId}/restore")
    public ResponseEntity<ApiResponse<?>> restoreVersion(
            @PathVariable Long id,
            @PathVariable Long versionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(documentService.restoreVersion(id, versionId, getUserId(userDetails))));
    }
}
