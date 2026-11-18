package com.noteflow.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "document_stars")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentStar {

    @EmbeddedId
    private DocumentStarId id;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
