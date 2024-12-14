package com.anthonydaniel.fileflow.metadata.graphql;

import com.anthonydaniel.fileflow.metadata.model.FileMetadata;
import com.anthonydaniel.fileflow.metadata.service.MetadataService;
import graphql.kickstart.tools.GraphQLQueryResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
public class MetadataQueryResolver {
    @Autowired
    private MetadataService metadataService;

    @QueryMapping
    public List<FileMetadata> getAllMetadata() {
        return metadataService.getAllMetadata();
    }

    @QueryMapping
    public FileMetadata getMetadataById(@Argument Integer id) {
        return metadataService.getMetadataById(id);
    }

    @QueryMapping
    public List<FileMetadata> searchMetadata(@Argument String fileName) {
        return metadataService.searchMetadata(fileName);
    }

    @QueryMapping
    public List<FileMetadata> getFilesByOwner(@Argument String owner) {
        return metadataService.getFilesByOwner(owner);
    }
}
