package com.noteflow.controller;

import com.noteflow.dto.response.ApiResponse;
import com.noteflow.repository.UserRepository;
import com.noteflow.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getDashboardStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboardStats(getUserId(userDetails))));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<?>> getRecentDocuments(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRecentDocuments(getUserId(userDetails))));
    }

    @GetMapping("/starred")
    public ResponseEntity<ApiResponse<?>> getStarredItems(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getStarredItems(getUserId(userDetails))));
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<?>> getRecentActivity(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getRecentActivity(getUserId(userDetails))));
    }
}
