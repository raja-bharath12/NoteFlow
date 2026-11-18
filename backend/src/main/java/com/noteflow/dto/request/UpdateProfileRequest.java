package com.noteflow.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(min = 3, max = 50)
    private String username;
    private String avatarUrl;
}
