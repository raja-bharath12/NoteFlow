package com.noteflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFolderRequest {
    @NotBlank(message = "Folder name is required")
    @Size(max = 255)
    private String name;
    private Long parentFolderId;
    private String color = "#3b82f6";
    private String icon = "folder";
}
