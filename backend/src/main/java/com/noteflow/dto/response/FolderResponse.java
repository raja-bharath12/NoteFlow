package com.noteflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderResponse {
    private Long id;
    private String name;
    private Long parentFolderId;
    private Long ownerId;
    private String ownerName;
    private String color;
    private String icon;
    private boolean isStarred;
    private boolean isTrashed;
    private LocalDateTime trashedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int documentCount;
    private int subfolderCount;
    private List<FolderResponse> children; // null unless explicitly loaded
}
