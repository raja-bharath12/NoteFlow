package com.noteflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "folder_stars")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderStar {

    @EmbeddedId
    private FolderStarId id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
