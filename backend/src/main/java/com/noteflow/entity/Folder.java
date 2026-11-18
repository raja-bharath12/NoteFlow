package com.noteflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "folders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Folder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "parent_folder_id")
    private Long parentFolderId;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(length = 50)
    private String color;

    @Column(length = 50)
    private String icon;

    @Builder.Default
    @Column(name = "is_starred", columnDefinition = "TINYINT(1)")
    private boolean isStarred = false;

    @Builder.Default
    @Column(name = "is_trashed", columnDefinition = "TINYINT(1)")
    private boolean isTrashed = false;

    @Column(name = "trashed_at")
    private LocalDateTime trashedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
