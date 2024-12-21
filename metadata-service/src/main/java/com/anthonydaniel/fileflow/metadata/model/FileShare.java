package com.anthonydaniel.fileflow.metadata.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_shares",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"file_id", "shared_with_username"})
        })
public class FileShare {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer shareId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false)
    private FileMetadata file;

    @Column(name = "shared_with_username", nullable = false)
    private String sharedWithUsername;

    @Column(nullable = false)
    private LocalDateTime sharedDate = LocalDateTime.now();


    @Column(nullable = false)
    private String sharedByUsername;

    public Integer  getShareId() {
        return shareId;
    }

    public void setShareId(Integer id) {
        this.shareId = id;
    }

    public FileMetadata getFile() {
        return file;
    }

    public void setFile(FileMetadata file) {
        this.file = file;
    }

    public String getSharedWithUsername() {
        return sharedWithUsername;
    }

    public void setSharedWithUsername(String sharedWithUsername) {
        this.sharedWithUsername = sharedWithUsername;
    }

    public LocalDateTime getSharedDate() {
        return sharedDate;
    }

    public void setSharedDate(LocalDateTime sharedDate) {
        this.sharedDate = sharedDate;
    }


    public String getSharedByUsername() {
        return sharedByUsername;
    }

    public void setSharedByUsername(String sharedByUsername) {
        this.sharedByUsername = sharedByUsername;
    }
}