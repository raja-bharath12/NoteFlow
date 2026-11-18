package com.noteflow.repository;

import com.noteflow.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByOwnerIdAndIsTrashedFalse(Long ownerId);

    List<Folder> findByParentFolderIdAndOwnerIdAndIsTrashedFalse(Long parentFolderId, Long ownerId);

    List<Folder> findByParentFolderIdIsNullAndOwnerIdAndIsTrashedFalse(Long ownerId);

    List<Folder> findByOwnerIdAndIsTrashedTrue(Long ownerId);

    List<Folder> findByOwnerIdAndIsStarredTrueAndIsTrashedFalse(Long ownerId);

    @Query("SELECT f FROM Folder f WHERE f.ownerId = :ownerId AND f.isTrashed = false AND LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Folder> searchByName(@Param("query") String query, @Param("ownerId") Long ownerId);

    long countByOwnerIdAndIsTrashedFalse(Long ownerId);
}
