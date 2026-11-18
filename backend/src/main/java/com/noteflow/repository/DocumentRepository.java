package com.noteflow.repository;

import com.noteflow.entity.Document;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByOwnerIdAndIsTrashedFalse(Long ownerId);

    List<Document> findByFolderIdAndIsTrashedFalse(Long folderId);

    List<Document> findByOwnerIdAndIsTrashedTrue(Long ownerId);

    List<Document> findByOwnerIdAndIsTrashedFalseOrderByLastOpenedAtDesc(Long ownerId);

    List<Document> findByOwnerIdAndIsStarredTrueAndIsTrashedFalse(Long ownerId);

    List<Document> findByOwnerIdAndFolderIdAndIsTrashedFalse(Long ownerId, Long folderId);

    @Query("SELECT d FROM Document d WHERE d.ownerId = :ownerId AND d.isTrashed = false ORDER BY d.lastOpenedAt DESC NULLS LAST")
    List<Document> findRecentByOwnerId(@Param("ownerId") Long ownerId, Pageable pageable);

    @Query("SELECT d FROM Document d WHERE d.ownerId = :ownerId AND d.isTrashed = false AND " +
           "(LOWER(d.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(d.content) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Document> searchByTitleOrContent(@Param("query") String query, @Param("ownerId") Long ownerId);

    long countByOwnerIdAndIsTrashedFalse(Long ownerId);

    long countByOwnerIdAndIsStarredTrueAndIsTrashedFalse(Long ownerId);
}
