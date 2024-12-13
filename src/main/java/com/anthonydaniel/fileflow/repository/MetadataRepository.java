package com.anthonydaniel.fileflow.repository;

import com.anthonydaniel.fileflow.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MetadataRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findByFileNameContaining(String fileName);
    void deleteByFileName(String fileName);
}
