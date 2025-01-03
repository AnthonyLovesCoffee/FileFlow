package com.anthonydaniel.fileflow.filemanagement.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.errors.ErrorResponseException;
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

    @Value("${minio.accessKey}")
    private String accessKey;

    @Value("${minio.secretKey}")
    private String secretKey;

    @Value("${minio.bucket:fileflow}")
    private String bucketName;

    @Bean
    public MinioClient minioClient() {
        try {
            logger.info("Initializing MinIO client with endpoint: {}", endpoint);
            MinioClient minioClient = MinioClient.builder()
                    .endpoint(endpoint)
                    .credentials(accessKey, secretKey)
                    .build();

            // verify connection and bucket
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (!bucketExists) {
                try {
                    logger.info("Bucket '{}' does not exist, creating it...", bucketName);
                    minioClient.makeBucket(MakeBucketArgs.builder()
                            .bucket(bucketName)
                            .build());
                    logger.info("Bucket '{}' created successfully", bucketName);
                } catch (ErrorResponseException e) {
                    // check if the error is because the bucket already exists
                    if (e.getMessage().contains("you already own it")) {
                        logger.info("Bucket '{}' already exists and is owned by us", bucketName);
                    } else {
                        // if different error, rethrow it
                        throw e;
                    }
                }
            } else {
                logger.info("Connected to MinIO successfully, bucket '{}' exists", bucketName);
            }

            return minioClient;
        } catch (Exception e) {
            logger.error("Failed to initialize MinIO client: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize MinIO client", e);
        }
    }
}