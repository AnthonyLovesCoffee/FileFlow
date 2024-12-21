package com.anthonydaniel.fileflow.metadata.service;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import com.anthonydaniel.fileflow.metadata.model.FileShare;
import com.anthonydaniel.fileflow.metadata.repository.FileShareRepository;
import com.anthonydaniel.fileflow.metadata.repository.MetadataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class FileShareService {

    @Autowired
    private FileShareRepository fileShareRepository;

    @Autowired
    private MetadataRepository metadataRepository;

    @Transactional
    public boolean shareFile(Integer fileId, String sharedWithUsername, String sharedByUsername) {
        try {
            // check file exists
            Optional<FileMetadata> fileMetadata = metadataRepository.findById(Long.valueOf(fileId));
            if (fileMetadata.isEmpty()) {
                throw new RuntimeException("File not found");
            }

            // check if user sharing with themselves
            if (sharedWithUsername.equals(sharedByUsername)) {
                throw new RuntimeException("Cannot share file with yourself");
            }

            // check if user is owner of file
            if (!fileMetadata.get().getOwner().equals(sharedByUsername)) {
                throw new RuntimeException("Only file owner can share the file");
            }

            // check if file is already shared with this user
            Optional<FileShare> existingShare = fileShareRepository.findByFileIdAndSharedWithUsername(
                    fileId, sharedWithUsername);
            if (existingShare.isPresent()) {
                throw new RuntimeException("File is already shared with this user");
            }

            // create new share
            FileShare fileShare = new FileShare();
            fileShare.setFile(fileMetadata.get());
            fileShare.setSharedWithUsername(sharedWithUsername);
            fileShare.setSharedByUsername(sharedByUsername);
            fileShare.setSharedDate(LocalDateTime.now());

            fileShareRepository.save(fileShare);
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to share file: " + e.getMessage());
        }
    }

    @Transactional
    public boolean revokeShare(Integer fileId, String sharedWithUsername, String sharedByUsername) {
        try {
            // check file exists
            Optional<FileMetadata> fileMetadata = metadataRepository.findById(Long.valueOf(fileId));
            if (fileMetadata.isEmpty()) {
                throw new RuntimeException("File not found");
            }

            // check if user is owner
            if (!fileMetadata.get().getOwner().equals(sharedByUsername)) {
                throw new RuntimeException("Only file owner can revoke share");
            }

            // find and delete the share
            Optional<FileShare> fileShare = fileShareRepository.findByFileIdAndSharedWithUsername(
                    fileId, sharedWithUsername);
            if (fileShare.isEmpty()) {
                throw new RuntimeException("Share not found");
            }

            fileShareRepository.delete(fileShare.get());
            return true;
        } catch (Exception e) {
            throw new RuntimeException("Failed to revoke share: " + e.getMessage());
        }
    }

    public boolean hasFileAccess(Integer fileId, String username) {
        try {
            if (fileId == null || username == null || username.trim().isEmpty()) {
                return false;
            }

            // check if file exists
            Optional<FileMetadata> fileMetadata = metadataRepository.findById(Long.valueOf(fileId));
            if (fileMetadata.isEmpty()) {
                return false;
            }

            // if user is owner, they have access
            if (username.equals(fileMetadata.get().getOwner())) {
                return true;
            }

            // check if file is shared with user
            return fileShareRepository.findByFileIdAndSharedWithUsername(fileId, username).isPresent();
        } catch (Exception e) {
            // return false instead of throwing error
            //logger.error("Error checking file access: {}", e.getMessage(), e);
            return false;
        }
    }

    public List<FileShare> getFilesSharedWithUser(String username) {
        return fileShareRepository.findFileSharesBySharedWithUsername(username);
    }

    public List<FileShare> getSharesForFile(Integer fileId) {
        return fileShareRepository.findByFileId(fileId);
    }

    public List<FileShare> getFilesSharedByUser(String username) {
        return fileShareRepository.findFileSharesBySharedByUsername(username);
    }

    public List<FileShare> getSharesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return fileShareRepository.findBySharedDateBetween(startDate, endDate);
    }

    public List<FileShare> getRecentShares(String username, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return fileShareRepository.findBySharedWithUsernameAndSharedDateAfter(username, startDate);
    }

    public Optional<LocalDateTime> getShareDate(Integer fileId, String sharedWithUsername) {
        Optional<FileShare> share = fileShareRepository.findByFileIdAndSharedWithUsername(fileId, sharedWithUsername);
        return share.map(FileShare::getSharedDate);
    }
}