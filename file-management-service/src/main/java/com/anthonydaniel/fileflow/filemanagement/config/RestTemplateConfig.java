package com.anthonydaniel.fileflow.filemanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {

    @Bean(name = "metadataRestTemplate")
    public RestTemplate metadataRestTemplate() {
        return new RestTemplate();
    }
}