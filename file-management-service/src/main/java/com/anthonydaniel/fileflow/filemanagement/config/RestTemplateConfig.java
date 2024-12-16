package com.anthonydaniel.fileflow.filemanagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestTemplateConfig {
    // needed to add this - otherwise File Service would try to use Eureka to find minIO
    @Bean(name = "metadataRestTemplate")
    public RestTemplate metadataRestTemplate() {
        return new RestTemplate();
    }
}