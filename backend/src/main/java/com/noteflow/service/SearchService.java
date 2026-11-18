package com.noteflow.service;

import com.noteflow.entity.Document;
import com.noteflow.entity.Folder;
import com.noteflow.repository.DocumentRepository;
import com.noteflow.repository.FolderRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchService {

    private final DocumentRepository documentRepository;
    private final FolderRepository folderRepository;

    public Map<String, Object> search(String query, String type, Long userId) {
        if (query == null || query.isBlank()) {
            Map<String, Object> empty = new HashMap<>();
            empty.put("documents", List.of());
            empty.put("folders", List.of());
            empty.put("total", 0);
            return empty;
        }

        String q = query.trim().toLowerCase();
        List<Document> documents = new ArrayList<>();
        List<Folder> folders = new ArrayList<>();

        if ("ALL".equalsIgnoreCase(type) || "DOCUMENT".equalsIgnoreCase(type)) {
            documents = documentRepository.findByOwnerIdAndIsTrashedFalse(userId)
                    .stream()
                    .filter(d -> (d.getTitle() != null && d.getTitle().toLowerCase().contains(q))
                            || (d.getContent() != null && d.getContent().toLowerCase().contains(q)))
                    .limit(20)
                    .collect(Collectors.toList());
        }

        if ("ALL".equalsIgnoreCase(type) || "FOLDER".equalsIgnoreCase(type)) {
            folders = folderRepository.findByOwnerIdAndIsTrashedFalse(userId)
                    .stream()
                    .filter(f -> f.getName() != null && f.getName().toLowerCase().contains(q))
                    .limit(10)
                    .collect(Collectors.toList());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("documents", documents);
        result.put("folders", folders);
        result.put("total", documents.size() + folders.size());
        result.put("query", query);
        return result;
    }
}
