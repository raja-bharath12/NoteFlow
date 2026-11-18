package com.noteflow.controller;

import com.noteflow.dto.response.ApiResponse;
import com.noteflow.entity.Comment;
import com.noteflow.repository.UserRepository;
import com.noteflow.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }

    @GetMapping("/document/{documentId}")
    public ResponseEntity<ApiResponse<List<Comment>>> getComments(
            @PathVariable Long documentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(commentService.getComments(documentId, getUserId(userDetails))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Comment>> addComment(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = getUserId(userDetails);
        Long documentId = Long.parseLong(body.get("documentId").toString());
        String content = (String) body.get("content");
        Long parentId = body.get("parentCommentId") != null ?
            Long.parseLong(body.get("parentCommentId").toString()) : null;
        Comment comment = commentService.addComment(documentId, userId, content, parentId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Comment added", comment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Comment>> updateComment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String content = (String) body.get("content");
        return ResponseEntity.ok(ApiResponse.success(commentService.updateComment(id, content, getUserId(userDetails))));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(id, getUserId(userDetails));
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<Comment>> resolveComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(commentService.resolveComment(id, getUserId(userDetails))));
    }

    @PutMapping("/{id}/unresolve")
    public ResponseEntity<ApiResponse<Comment>> unresolveComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(commentService.unresolveComment(id, getUserId(userDetails))));
    }
}
