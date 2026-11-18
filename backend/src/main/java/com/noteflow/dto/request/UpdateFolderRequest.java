package com.noteflow.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateFolderRequest {
    @Size(max = 255)
    private String name;
    private Long parentFolderId;
    private String color;
    private String icon;
    private Boolean isStarred;
}
