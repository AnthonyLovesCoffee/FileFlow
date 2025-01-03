package com.anthonydaniel.fileflow.metadata.repository;

import com.anthonydaniel.fileflow.metadata.model.FileShare;
import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileShareRepository extends JpaRepository<FileShare, Long> {

    Optional<FileShare> findByFileIdAndSharedWithUsername(Integer fileId, String sharedWithUsername);

    List<FileShare> findByFileId(Integer fileId);

    List<FileShare> findBySharedDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<FileShare> findBySharedWithUsernameAndSharedDateAfter(String username, LocalDateTime date);
    void deleteByFileId(Integer fileId);

    @Query("SELECT fs FROM FileShare fs WHERE fs.sharedWithUsername = :username")
    List<FileShare> findFileSharesBySharedWithUsername(@Param("username") String username);

    @Query("SELECT fs FROM FileShare fs WHERE fs.sharedByUsername = :username")
    List<FileShare> findFileSharesBySharedByUsername(@Param("username") String username);
}