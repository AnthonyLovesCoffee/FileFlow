package com.anthonydaniel.fileflow.filemanagement.service;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class FileService {

    private final String uploadDir = "uploads/";

    @Autowired
    private RestTemplate restTemplate;

    public String saveFile(MultipartFile file, String userId) {
        try {
            // Save file to local filesystem
            Path userDir = Paths.get(uploadDir + userId);
            Files.createDirectories(userDir);
            Path filePath = userDir.resolve(file.getOriginalFilename());
            Files.write(filePath, file.getBytes());

            // Notify Metadata Service
            String url = "http://localhost:8082/graphql"; // Metadata Service URL
            String mutation = """
                mutation {
                    saveMetadata(fileName: "%s", fileSize: %d, owner: "%s") {
                        id
                        fileName
                        fileSize
                        owner
                    }
                }
            """.formatted(file.getOriginalFilename(), file.getSize(), userId);

            Map<String, Object> response = restTemplate.postForObject(
                    url,
                    Map.of("query", mutation),
                    Map.class
            );

            return "File uploaded and metadata saved successfully!";
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
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

//    public void deleteFile(String fileName) {
//        try {
//            Path filePath = Paths.get(uploadDir + fileName);
//            Files.deleteIfExists(filePath);
//
//            // deleting metadata from the database
//            MetadataRepository.deleteByFileName(fileName);
//        } catch (IOException e) {
//            throw new RuntimeException("Failed to delete file", e);
//        }
//    }
}
