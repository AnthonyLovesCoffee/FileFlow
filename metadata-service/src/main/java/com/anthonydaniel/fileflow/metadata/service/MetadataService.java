package com.anthonydaniel.fileflow.metadata.service;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import com.anthonydaniel.fileflow.metadata.repository.MetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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

    public FileMetadata saveMetadata(String fileName, Integer fileSize, String owner) {
        System.out.println("Service received: fileName=" + fileName + ", fileSize=" + fileSize + ", owner=" + owner);
        FileMetadata metadata = new FileMetadata();
        metadata.setFileName(fileName);
        metadata.setFileSize(fileSize);
        metadata.setOwner(owner);
        metadata.setUploadDate(LocalDateTime.now());

        try {
            FileMetadata savedMetadata = repository.save(metadata);
            System.out.println("Repository saved metadata: " + savedMetadata);
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
}

