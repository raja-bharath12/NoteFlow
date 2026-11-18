package com.noteflow.controller;

import com.noteflow.dto.response.ApiResponse;
import com.noteflow.repository.UserRepository;
import com.noteflow.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final UserRepository userRepository;

    private Long getUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername()).orElseThrow().getId();
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "ALL") String type,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(searchService.search(q, type, getUserId(userDetails))));
    }
}
