package com.anthonydaniel.fileflow.filemanagement.config;

import io.minio.MinioClient;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MinioConfig {
    private static final Logger logger = LoggerFactory.getLogger(MinioConfig.class);


    @Value("${minio.endpoint}")
    private String endpoint;

    @Value("${minio.access-key}")
    private String accessKey;

    @Value("${minio.secret-key}")
    private String secretKey;

    @Bean
    public MinioClient minioClient() {
        try {
            logger.info("Creating MinIO client with endpoint: {}, accessKey: {}", endpoint, accessKey);
            MinioClient client = MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .build();

            // Test connection
            client.listBuckets();
            logger.info("Successfully connected to MinIO");

            return client;
        } catch (Exception e) {
            logger.error("Failed to create MinIO client: {}", e.getMessage());
            throw new RuntimeException("Could not create MinIO client", e);
        }
    }
}