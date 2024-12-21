package com.anthonydaniel.fileflow.metadata.graphql;

import com.anthonydaniel.fileflow.metadata.service.FileShareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Controller;

@Controller
public class FileShareMutationResolver {

    @Autowired
    private FileShareService fileShareService;

    @MutationMapping
    public Boolean shareFile(
            @Argument Integer fileId,
            @Argument String sharedWithUsername,
            @Argument String sharedByUsername) {
        return fileShareService.shareFile(fileId, sharedWithUsername, sharedByUsername);
    }

    @MutationMapping
    public Boolean revokeShare(
            @Argument Integer fileId,
            @Argument String sharedWithUsername,
            @Argument String sharedByUsername) {
        return fileShareService.revokeShare(fileId, sharedWithUsername, sharedByUsername);
    }
}