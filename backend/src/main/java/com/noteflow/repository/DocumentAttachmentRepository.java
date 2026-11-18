package com.noteflow.repository;

import com.noteflow.entity.DocumentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentAttachmentRepository extends JpaRepository<DocumentAttachment, Long> {
    List<DocumentAttachment> findByDocumentId(Long documentId);
    Optional<DocumentAttachment> findByDocumentIdAndId(Long documentId, Long id);
}
