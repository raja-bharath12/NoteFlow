package com.noteflow.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String email;
    private String username;
    private String avatarUrl;
    private boolean isEmailVerified;
    private LocalDateTime createdAt;
}
