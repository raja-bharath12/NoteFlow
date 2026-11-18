package com.noteflow.repository;

import com.noteflow.entity.FolderPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderPermissionRepository extends JpaRepository<FolderPermission, Long> {

    Optional<FolderPermission> findByFolderIdAndUserId(Long folderId, Long userId);

    List<FolderPermission> findByFolderId(Long folderId);

    List<FolderPermission> findByUserId(Long userId);

    void deleteByFolderIdAndUserId(Long folderId, Long userId);
}
