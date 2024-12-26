package com.anthonydaniel.fileflow.metadata.graphql;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import com.anthonydaniel.fileflow.metadata.service.MetadataService;
import graphql.kickstart.tools.GraphQLMutationResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;

import java.util.List;


@Controller
public class MetadataMutationResolver {
    @Autowired
    private MetadataService metadataService;

    @MutationMapping
    public FileMetadata saveMetadata(
            @Argument String fileName,
            @Argument Integer fileSize,
            @Argument String owner,
            @Argument List<String> tags
    ) {
        return metadataService.saveMetadata(fileName, fileSize, owner, tags);
    }

    @MutationMapping
    public boolean deleteMetadata(@Argument Integer id) {
        return metadataService.deleteMetadata(id);
    }
}
