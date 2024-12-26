package com.anthonydaniel.fileflow.metadata.repository;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

@Repository
public interface MetadataRepository extends JpaRepository<FileMetadata, Long> {
    List<FileMetadata> findByFileNameContaining(String fileName);
    List<FileMetadata> findByOwner(String owner);

    @Query("SELECT f FROM FileMetadata f JOIN f.tags t WHERE t = :tag")
    List<FileMetadata> findByTag(@Param("tag") String tag);
}
