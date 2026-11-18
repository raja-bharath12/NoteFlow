package com.noteflow.repository;

import com.noteflow.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByDocumentIdOrderByCreatedAtAsc(Long documentId);

    List<Comment> findByDocumentIdAndParentCommentIdIsNullOrderByCreatedAtAsc(Long documentId);

    List<Comment> findByParentCommentIdOrderByCreatedAtAsc(Long parentCommentId);

    long countByDocumentId(Long documentId);
}
