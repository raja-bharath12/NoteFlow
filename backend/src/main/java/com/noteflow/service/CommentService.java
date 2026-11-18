package com.noteflow.service;

import com.noteflow.entity.Comment;
import com.noteflow.exception.AccessDeniedException;
import com.noteflow.exception.BadRequestException;
import com.noteflow.exception.ResourceNotFoundException;
import com.noteflow.repository.CommentRepository;
import com.noteflow.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final DocumentRepository documentRepository;
    private final PermissionService permissionService;

    @Transactional(readOnly = true)
    public List<Comment> getComments(Long documentId, Long userId) {
        if (!permissionService.canViewDocument(documentId, userId)) {
            throw new AccessDeniedException("You don't have access to this document");
        }
        return commentRepository.findByDocumentIdAndParentCommentIdIsNullOrderByCreatedAtAsc(documentId);
    }

    public Comment addComment(Long documentId, Long userId, String content, Long parentCommentId) {
        if (!permissionService.canCommentOnDocument(documentId, userId)) {
            throw new AccessDeniedException("You don't have permission to comment on this document");
        }
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Comment content cannot be empty");
        }

        Comment comment = Comment.builder()
                .documentId(documentId)
                .authorId(userId)
                .content(content.trim())
                .parentCommentId(parentCommentId)
                .isResolved(false)
                .build();
        return commentRepository.save(comment);
    }

    public Comment updateComment(Long commentId, String content, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getAuthorId().equals(userId)) {
            throw new AccessDeniedException("You can only edit your own comments");
        }
        if (content == null || content.isBlank()) {
            throw new BadRequestException("Comment content cannot be empty");
        }
        comment.setContent(content.trim());
        return commentRepository.save(comment);
    }

    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        // Allow author or document owner to delete
        boolean isAuthor = comment.getAuthorId().equals(userId);
        boolean isDocOwner = permissionService.isDocumentOwner(comment.getDocumentId(), userId);
        if (!isAuthor && !isDocOwner) {
            throw new AccessDeniedException("You don't have permission to delete this comment");
        }
        commentRepository.delete(comment);
    }

    public Comment resolveComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!permissionService.canEditDocument(comment.getDocumentId(), userId)) {
            throw new AccessDeniedException("You don't have permission to resolve comments");
        }
        comment.setResolved(true);
        comment.setResolvedBy(userId);
        comment.setResolvedAt(LocalDateTime.now());
        return commentRepository.save(comment);
    }

    public Comment unresolveComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!permissionService.canEditDocument(comment.getDocumentId(), userId)) {
            throw new AccessDeniedException("You don't have permission to unresolve comments");
        }
        comment.setResolved(false);
        comment.setResolvedBy(null);
        comment.setResolvedAt(null);
        return commentRepository.save(comment);
    }
}
