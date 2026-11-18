package com.noteflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderStarId implements Serializable {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "folder_id", nullable = false)
    private Long folderId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FolderStarId that = (FolderStarId) o;
        return Objects.equals(userId, that.userId) &&
               Objects.equals(folderId, that.folderId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, folderId);
    }
}
