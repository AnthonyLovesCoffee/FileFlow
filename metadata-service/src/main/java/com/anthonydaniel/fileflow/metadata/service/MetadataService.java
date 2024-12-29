package com.anthonydaniel.fileflow.metadata.service;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import com.anthonydaniel.fileflow.metadata.repository.MetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class MetadataService {

    @Autowired
    private MetadataRepository repository;

    public List<FileMetadata> getAllMetadata() {
        return repository.findAll();
    }

    public FileMetadata getMetadataById(Integer id) {
        return repository.findById(Long.valueOf(id)).orElseThrow(() -> new RuntimeException("Metadata not found"));
    }

    public List<FileMetadata> searchMetadata(String fileName) {
        return repository.findByFileNameContaining(fileName);
    }

    public FileMetadata saveMetadata(String fileName, Integer fileSize, String owner, List<String> tags) {
        System.out.println("Service received: fileName=" + fileName +
                ", fileSize=" + fileSize +
                ", owner=" + owner +
                ", tags=" + tags); // debug

        FileMetadata metadata = new FileMetadata();
        metadata.setFileName(fileName);
        metadata.setFileSize(fileSize);
        metadata.setOwner(owner);
        metadata.setUploadDate(LocalDateTime.now());
        if (tags != null && !tags.isEmpty()) {
            Set<String> tagSet = new HashSet<>(tags);
            metadata.setTags(tagSet);
            System.out.println("Adding tags to metadata: " + tagSet);
        } else {
            metadata.setTags(new HashSet<>()); // empty set if no tags
            System.out.println("No tags provided, initializing empty set");
        }

        try {
            FileMetadata savedMetadata = repository.save(metadata);
            System.out.println("Saved metadata with ID: " + savedMetadata.getId());
            System.out.println("Saved metadata tags: " + savedMetadata.getTags());
            return savedMetadata;
        } catch (Exception e) {
            System.err.println("Error saving metadata: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    public boolean deleteMetadata(Integer id) {
        if (repository.existsById(Long.valueOf(id))) {
            repository.deleteById(Long.valueOf(id));
            return true;
        }
        return false;
    }

    public List<FileMetadata> getFilesByOwner(String owner) {
        return repository.findByOwner(owner);
    }

    public List<FileMetadata> getByTag(String tag) {
        return repository.findByTag(tag);
    }
}

