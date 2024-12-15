package com.anthonydaniel.fileflow.metadata;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import com.anthonydaniel.fileflow.metadata.repository.MetadataRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
public class MetadataRepositoryTest {

    @Autowired
    private MetadataRepository repository;

    @Test
    public void testSaveMetadata() {
        FileMetadata metadata = new FileMetadata();
        metadata.setFileName("example.txt");
        metadata.setFileSize(1024);
        metadata.setOwner("user_1");
        metadata.setUploadDate(LocalDateTime.now());

        FileMetadata savedMetadata = repository.save(metadata);

        assertNotNull(savedMetadata.getId());
        assertEquals("example.txt", savedMetadata.getFileName());
        assertEquals(1024, savedMetadata.getFileSize());
        assertEquals("user_1", savedMetadata.getOwner());
        assertNotNull(savedMetadata.getUploadDate());

    }
}

