package com.anthonydaniel.fileflow.filemanagement.config;

import io.minio.BucketExistsArgs;
import io.minio.MinioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class MinioHealthIndicator implements HealthIndicator {
    private static final Logger logger = LoggerFactory.getLogger(MinioHealthIndicator.class);
    private final MinioClient minioClient;
    private final String bucketName = "fileflow";

    public MinioHealthIndicator(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    @Override
    public Health health() {
        try {
            logger.debug("Checking MinIO health...");
            boolean bucketExists = minioClient.bucketExists(BucketExistsArgs.builder()
                    .bucket(bucketName)
                    .build());

            if (bucketExists) {
                logger.debug("MinIO health check passed");
                return Health.up()
                        .withDetail("bucket", bucketName)
                        .withDetail("status", "Available")
                        .build();
            } else {
                logger.warn("MinIO health check failed: bucket does not exist");
                return Health.down()
                        .withDetail("bucket", bucketName)
                        .withDetail("status", "Bucket not found")
                        .build();
            }
        } catch (Exception e) {
            logger.error("MinIO health check failed: {}", e.getMessage());
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}