package com.noteflow.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateDocumentRequest {
    @Size(max = 500)
    private String title = "Untitled";
    private Long folderId;
    private String content;
}
