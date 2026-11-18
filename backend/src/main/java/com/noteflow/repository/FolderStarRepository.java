package com.noteflow.repository;

import com.noteflow.entity.FolderStar;
import com.noteflow.entity.FolderStarId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FolderStarRepository extends JpaRepository<FolderStar, FolderStarId> {
    List<FolderStar> findByIdUserId(Long userId);
    boolean existsByIdUserIdAndIdFolderId(Long userId, Long folderId);
}
