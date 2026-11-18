package com.noteflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Builder.Default
    @Column(name = "is_starred", columnDefinition = "TINYINT(1)")
    private boolean isStarred = false;

    @Builder.Default
    @Column(name = "is_trashed", columnDefinition = "TINYINT(1)")
    private boolean isTrashed = false;

    @Column(name = "trashed_at")
    private LocalDateTime trashedAt;

    @Builder.Default
    @Column(name = "word_count")
    private Integer wordCount = 0;

    @Column(name = "last_opened_at")
    private LocalDateTime lastOpenedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
