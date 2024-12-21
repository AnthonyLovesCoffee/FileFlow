package com.anthonydaniel.fileflow.metadata.graphql;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import com.anthonydaniel.fileflow.metadata.model.FileShare;
import com.anthonydaniel.fileflow.metadata.service.FileShareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.Collections;
import java.util.List;

@Controller
public class FileShareQueryResolver {

    @Autowired
    private FileShareService fileShareService;

    // for a username, returns files that were shared with username
    @QueryMapping
    public List<FileShare> getFilesSharedWithMe(@Argument String username) {
        try {
            List<FileShare> shares = fileShareService.getFilesSharedWithUser(username);
            return shares != null ? shares : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList(); // return empty list
        }
    }

    // for a username, returns files that username has shared
    @QueryMapping
    public List<FileShare> getFilesSharedByMe(@Argument String username) {
        try {
            List<FileShare> shares = fileShareService.getFilesSharedByUser(username);
            return shares != null ? shares : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // for a file id, returns who its shared to
    @QueryMapping
    public List<FileShare> getSharesForFile(@Argument Integer fileId) {
        try {
            List<FileShare> shares = fileShareService.getSharesForFile(fileId);
            return shares != null ? shares : Collections.emptyList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    // check if username can access file
    @QueryMapping
    public boolean hasFileAccess(@Argument Integer fileId, @Argument String username) {
        try {
            return fileShareService.hasFileAccess(fileId, username);
        } catch (Exception e) {
            return false; //return fale instead of errors
        }
    }
}