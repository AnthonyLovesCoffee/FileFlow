package com.anthonydaniel.fileflow.metadata;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {
        "com.anthonydaniel.fileflow.metadata",
        "com.anthonydaniel.fileflow.metadata.graphql",
        "com.anthonydaniel.fileflow.metadata.service"
})
public class MetadataServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(MetadataServiceApplication.class, args);
    }
}