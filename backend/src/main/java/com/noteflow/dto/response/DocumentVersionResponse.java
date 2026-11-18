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
public class DocumentVersionResponse {
    private Long id;
    private Long documentId;
    private String title;
    private String content;
    private int versionNumber;
    private int wordCount;
    private Long createdBy;
    private String creatorName;
    private LocalDateTime createdAt;
}
