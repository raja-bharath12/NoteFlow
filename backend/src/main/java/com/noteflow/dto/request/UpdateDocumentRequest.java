package com.noteflow.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDocumentRequest {
    @Size(max = 500)
    private String title;
    private String content;
    private Long folderId;
    private Boolean isStarred;
    private Integer wordCount;
}
