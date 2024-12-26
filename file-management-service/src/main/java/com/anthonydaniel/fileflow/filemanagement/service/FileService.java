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

    public String saveFile(MultipartFile file, String userId, List<String> tags) {
        try {
            // converting tags to a GraphQL-compatible string representation (["tag1", "tag2"])
            String tagsString = tags != null ? tags.stream()
                    .map(tag -> "\"" + tag + "\"")
                    .reduce((tag1, tag2) -> tag1 + ", " + tag2)
                    .map(result -> "[" + result + "]")
                    .orElse("[]") : "[]";

            // saving metadata to get the file ID
            String metadataMutation = """
            mutation {
                saveMetadata(fileName: "%s", fileSize: %d, owner: "%s", tags: %s) {
                    id
                    fileName
                }
            }
        """.formatted(file.getOriginalFilename(), file.getSize(), userId, tagsString);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", metadataMutation);

            Map<String, Object> response = metadataRestTemplate.postForObject(
                    metadataServiceUrl + "/graphql",
                    requestBody,
                    Map.class
            );

            // extract file ID from response
            Map<String, Object> data = (Map<String, Object>) response.get("data");
            Map<String, Object> savedMetadata = (Map<String, Object>) data.get("saveMetadata");
            Integer fileId = (Integer) savedMetadata.get("id");

            // add fileId to the object name
            String objectName = String.format("%s/%d_%s", userId, fileId, file.getOriginalFilename());
            InputStream inputStream = file.getInputStream();

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType())
                    .userMetadata(Map.of("fileId", fileId.toString()))
                    .build());

            return "File uploaded successfully. FileID: " + fileId;
        } catch (Exception e) {
            throw new RuntimeException("Error uploading file to MinIO: " + e.getMessage(), e);
        }
    }


    public Resource getFile(String requestingUserId, Integer fileId) {
        try {
            // get the filename + owner from metadata service
            String query = """
            query {
                getMetadataById(id: %d) {
                    fileName
                    owner
                }
            }
        """.formatted(fileId);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", query);

            ResponseEntity<Map<String, Object>> response = metadataRestTemplate.exchange(
                    metadataServiceUrl + "/graphql",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody),
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            Map<String, Object> metadata = (Map<String, Object>) data.get("getMetadataById");
            String fileName = (String) metadata.get("fileName");
            String owner = (String) metadata.get("owner");

            // use owners username to construct the objects name
            String objectName = String.format("%s/%d_%s", owner, fileId, fileName);

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

    public boolean checkFileAccessPermission(Integer fileId, String username, String authHeader) {
        try {
            logger.debug("Checking file access permission for fileId: {}, username: {}", fileId, username);

            // get the owner info
            String metadataQuery = """
            query {
                getMetadataById(id: %d) {
                    owner
                }
            }
        """.formatted(fileId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", authHeader);

            Map<String, Object> metadataRequestBody = new HashMap<>();
            metadataRequestBody.put("query", metadataQuery);

            HttpEntity<Map<String, Object>> metadataRequest = new HttpEntity<>(metadataRequestBody, headers);
            ResponseEntity<Map<String, Object>> metadataResponse = metadataRestTemplate.exchange(
                    metadataServiceUrl + "/graphql",
                    HttpMethod.POST,
                    metadataRequest,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (metadataResponse.getBody() != null) {
                Map<String, Object> data = (Map<String, Object>) metadataResponse.getBody().get("data");
                Map<String, Object> metadata = (Map<String, Object>) data.get("getMetadataById");
                String owner = (String) metadata.get("owner");

                // if user = owner, return true
                if (username.equals(owner)) {
                    logger.debug("User {} is the owner of file {}", username, fileId);
                    return true;
                }

                // if not owner, check if file is shared with user
                String accessQuery = """
                query {
                    hasFileAccess(fileId: %d, username: "%s")
                }
                """.formatted(fileId, username);

                Map<String, Object> accessRequestBody = new HashMap<>();
                accessRequestBody.put("query", accessQuery);

                HttpEntity<Map<String, Object>> accessRequest = new HttpEntity<>(accessRequestBody, headers);
                ResponseEntity<Map<String, Object>> accessResponse = metadataRestTemplate.exchange(
                        metadataServiceUrl + "/graphql",
                        HttpMethod.POST,
                        accessRequest,
                        new ParameterizedTypeReference<Map<String, Object>>() {}
                );

                if (accessResponse.getBody() != null) {
                    Map<String, Object> accessData = (Map<String, Object>) accessResponse.getBody().get("data");
                    if (accessData != null) {
                        Boolean hasAccess = (Boolean) accessData.get("hasFileAccess");
                        logger.debug("Access for user {} on file {}: {}", username, fileId, hasAccess);
                        return hasAccess != null && hasAccess;
                    }
                }
            }

            logger.warn("No access found for user {} on file {}", username, fileId);
            return false;
        } catch (Exception e) {
            logger.error("Error checking file access permission: {}", e.getMessage(), e);
            return false;
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
