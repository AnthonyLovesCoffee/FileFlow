package com.anthonydaniel.fileflow.service;
import com.anthonydaniel.fileflow.repository.MetadataRepository;
import com.anthonydaniel.fileflow.model.FileMetadata;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileService {

    private final String uploadDir = "uploads/";

    private final MetadataRepository MetadataRepository;

    @Autowired
    public FileService(MetadataRepository MetadataRepository) {
        this.MetadataRepository = MetadataRepository;
    }

    public String saveFile(MultipartFile file, String userId) {
        try {
            // each user gets their own directory
            Path userDir = Paths.get(uploadDir + userId);
            Files.createDirectories(userDir);

            // savw file in respective directory
            Path filePath = userDir.resolve(file.getOriginalFilename());
            Files.write(filePath, file.getBytes());

            long fileSize = file.getSize();

            // saving the metadata to the db
            FileMetadata metadata = new FileMetadata();
            metadata.setFileName(file.getOriginalFilename());
            metadata.setFileSize(fileSize);
            metadata.setOwner(userId);
            MetadataRepository.save(metadata);

            return "File uploaded successfully: " + file.getOriginalFilename();
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    public Resource getFile(String userId, String fileName) {
        try {
            Path filePath = Paths.get(uploadDir + userId + "/" + fileName);
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("File not found: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error loading file", e);
        }
    }

    public void deleteFile(String fileName) {
        try {
            Path filePath = Paths.get(uploadDir + fileName);
            Files.deleteIfExists(filePath);

            // deleting metadata from the database
            MetadataRepository.deleteByFileName(fileName);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }
}
