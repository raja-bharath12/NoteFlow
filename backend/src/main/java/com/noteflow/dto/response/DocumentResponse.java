package com.noteflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private String title;
    private String content;
    private Long folderId;
    private String folderName;
    private Long ownerId;
    private String ownerName;
    private boolean isStarred;
    private boolean isTrashed;
    private int wordCount;
    private LocalDateTime lastOpenedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String currentUserPermission; // OWNER, VIEWER, COMMENTER, EDITOR
    private int versionCount;
    private int commentCount;
}
