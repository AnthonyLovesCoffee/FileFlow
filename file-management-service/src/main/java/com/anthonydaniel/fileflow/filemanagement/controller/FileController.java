package com.anthonydaniel.fileflow.filemanagement.controller;

import com.anthonydaniel.fileflow.filemanagement.config.MinioConfig;
import com.anthonydaniel.fileflow.filemanagement.dto.TokenValidationResponse;
import com.anthonydaniel.fileflow.filemanagement.service.AuthenticationService;
import com.anthonydaniel.fileflow.filemanagement.service.FileService;
import okio.FileMetadata;
import org.apache.hc.core5.http.io.entity.FileEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/files")
public class FileController {

    private final FileService fileService;
    private static final Logger log = LoggerFactory.getLogger(FileController.class);
    private final RestTemplate metadataRestTemplate;
    private final String metadataServiceUrl;


    @Autowired
    private AuthenticationService authenticationService;

    @Autowired
    public FileController(FileService fileService, RestTemplate metadataRestTemplate,  @Value("${metadata.service.url:http://default-metadata-service}") String metadataServiceUrl) {
        this.fileService = fileService;
        this.metadataRestTemplate = metadataRestTemplate;
        this.metadataServiceUrl = metadataServiceUrl;

    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value="tags[]", required=false) List<String> tags,
            @RequestHeader("Authorization") String authHeader
    ) {
        log.info("Request received: file={}, size={}, contentType={}",
                file.getOriginalFilename(),
                file.getSize(),
                file.getContentType());
        log.info("Tags received: {}", tags);


        try {
            TokenValidationResponse validation = authenticationService.validateToken(authHeader);
            if (!validation.isValid()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(validation.getMessage());
            }

            // If tags is null, pass an empty list
            List<String> processedTags = tags != null ? tags : Collections.emptyList();
            log.info("Processed tags: {}", processedTags);

            String response = fileService.saveFile(file, validation.getUsername(), processedTags);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error uploading file: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading file: " + e.getMessage());
        }
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<String> uploadMultipleFiles(@RequestParam("files") List<MultipartFile> files,
                                                      @RequestParam(value="tags", required=false) List<String> tags,
                                                      @RequestHeader("Authorization") String authHeader) {
        try {
            // validate token
            TokenValidationResponse validation = authenticationService.validateToken(authHeader);
            if (!validation.isValid()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(validation.getMessage());
            }

            for (MultipartFile file : files) {
                fileService.saveFile(file, validation.getUsername(), tags);
            }
            return ResponseEntity.ok("Files uploaded successfully");
        } catch (Exception e) {
            log.error("Error uploading multiple files: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading files: " + e.getMessage());
        }
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<?> downloadFile(
            @PathVariable Integer fileId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Received download request for fileId: {}", fileId);

        try {
            // check if Authorization header exists
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                log.warn("Missing or invalid Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Authorization header is required");
            }
            log.info("Authorization header is present");

            // validate token with auth-service
            TokenValidationResponse validation = authenticationService.validateToken(authHeader);
            if (!validation.isValid()) {
                log.info("Token validation failed: {}", validation.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(validation.getMessage());
            }
            log.info("Token successfully validated");

            String username = validation.getUsername();
            log.info("Retrieved username: {} from token validation", username);

            // check file access permission
            boolean hasPermission = fileService.checkFileAccessPermission(fileId, username, authHeader);
            if (!hasPermission) {
                log.info("No permission for user {} to access file {}", username, fileId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You don't have permission to access this file");
            }

            try {
                log.info("Attempting to retrieve file {} for user {}", fileId, username);
                Resource file = fileService.getFile(username, fileId);

                // get the original filename from metadata service for Content-Disposition header
                String query = """
                    query {
                        getMetadataById(id: %d) {
                            fileName
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

                log.info("Successfully retrieved file: {} for user: {}", fileId, username);

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                        .body(file);
            } catch (RuntimeException e) {
                log.error("Failed to retrieve file: {} for user: {}. Error: {}", fileId, username, e.getMessage());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("File not found or could not be downloaded: " + e.getMessage());
            }
        } catch (Exception e) {
            log.error("Unexpected error processing download request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing request: " + e.getMessage());
        }
    }

    @GetMapping("/files-by-tag")
    public ResponseEntity<?> getFilesByTag(@RequestParam("tag") String tag,
                                           @RequestHeader("Authorization") String authHeader) {
        try {
            // validate token
            TokenValidationResponse validation = authenticationService.validateToken(authHeader);
            if (!validation.isValid()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(validation.getMessage());
            }

            // query our metadata service for files with the given tag
            String query = """
            query {
                getFilesByTag(tag: "%s") {
                    id
                    fileName
                    tags
                }
            }
        """.formatted(tag);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", query);

            ResponseEntity<Map<String, Object>> response = metadataRestTemplate.exchange(
                    metadataServiceUrl + "/graphql",
                    HttpMethod.POST,
                    new HttpEntity<>(requestBody),
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
            List<Map<String, Object>> files = (List<Map<String, Object>>) data.get("getFilesByTag");

            return ResponseEntity.ok(files);
        } catch (Exception e) {
            log.error("Error querying files by tag: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error querying files: " + e.getMessage());
        }
    }
}