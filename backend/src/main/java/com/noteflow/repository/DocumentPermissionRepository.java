package com.noteflow.repository;

import com.noteflow.entity.DocumentPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentPermissionRepository extends JpaRepository<DocumentPermission, Long> {

    Optional<DocumentPermission> findByDocumentIdAndUserId(Long documentId, Long userId);

    List<DocumentPermission> findByDocumentId(Long documentId);

    List<DocumentPermission> findByUserId(Long userId);

    void deleteByDocumentIdAndUserId(Long documentId, Long userId);

    long countByUserId(Long userId);
}
