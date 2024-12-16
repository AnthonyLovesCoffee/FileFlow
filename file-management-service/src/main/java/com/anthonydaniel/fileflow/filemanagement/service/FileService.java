package com.anthonydaniel.fileflow.filemanagement.service;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

import io.minio.messages.Item;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

//import java.io.IOException;
//import java.net.MalformedURLException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.nio.file.Paths;

import io.minio.*;

@Service
public class FileService {
    private static final Logger logger = LoggerFactory.getLogger(FileService.class);


    private final MinioClient minioClient;
    private final RestTemplate metadataRestTemplate;
    private final String bucketName = "fileflow";
    @Value("${metadata.service.url}")
    private final String metadataServiceUrl;


    @Autowired
    public FileService(MinioClient minioClient, @Value("${metadata.service.url:http://default-metadata-service}") String metadataServiceUrl, RestTemplate metadataRestTemplate) {
        this.metadataRestTemplate = metadataRestTemplate;
        logger.info("FileService constructor called with minioClient: {}", minioClient);
        this.metadataServiceUrl = metadataServiceUrl;
        this.minioClient = minioClient;
        initializeBucket();
    }

    private void initializeBucket() {
        try {
            logger.info("Checking if bucket {} exists...", bucketName);
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!bucketExists) {
                logger.info("Bucket {} does not exist, creating it...", bucketName);
                minioClient.makeBucket(MakeBucketArgs.builder()
                        .bucket(bucketName)
                        .build());
                logger.info("Bucket {} created successfully", bucketName);
            } else {
                logger.info("Bucket {} already exists", bucketName);
            }
        } catch (ErrorResponseException e) {
            logger.error("MinIO authentication failed: {}", e.getMessage());
            throw new RuntimeException("MinIO authentication failed: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Error initializing MinIO bucket: {}", e.getMessage());
            throw new RuntimeException("Error initializing MinIO bucket: " + e.getMessage(), e);
        }
    }

    @Autowired
    private RestTemplate restTemplate;

    public String saveFile(MultipartFile file, String userId) {
        try {
            String objectName = userId + "/" + file.getOriginalFilename();
            InputStream inputStream = file.getInputStream();

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());

            // Notify Metadata Service
            String url = metadataServiceUrl + "/graphql"; // Metadata Service URL
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

            Map<String, Object> response = metadataRestTemplate.postForObject(
                    url,
                    Map.of("query", mutation),
                    Map.class
            );

            return "File uploaded successfully: " + file.getOriginalFilename();
        } catch (Exception e) {
            throw new RuntimeException("Error uploading file to MinIO: " + e.getMessage(), e);
        }
    }

    public Resource getFile(String userId, String fileName) {
        try {
            String objectName = userId + "/" + fileName;
            InputStream stream = minioClient.getObject(GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build());

            byte[] content = stream.readAllBytes();
            return new ByteArrayResource(content);
        } catch (Exception e) {
            throw new RuntimeException("Error downloading file from MinIO: " + e.getMessage(), e);
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
