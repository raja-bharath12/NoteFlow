package com.noteflow.repository;

import com.noteflow.entity.DocumentStar;
import com.noteflow.entity.DocumentStarId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentStarRepository extends JpaRepository<DocumentStar, DocumentStarId> {
    List<DocumentStar> findByIdUserId(Long userId);
    boolean existsByIdUserIdAndIdDocumentId(Long userId, Long documentId);
}
