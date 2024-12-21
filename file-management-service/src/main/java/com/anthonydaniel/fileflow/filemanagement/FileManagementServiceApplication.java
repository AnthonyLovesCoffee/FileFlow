package com.anthonydaniel.fileflow.filemanagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.client.RestTemplate;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;


@SpringBootApplication
@ComponentScan(basePackages = "com.anthonydaniel.fileflow.filemanagement")

@EnableDiscoveryClient
@EnableFeignClients
    public class FileManagementServiceApplication {

        public static void main(String[] args) {
            SpringApplication.run(FileManagementServiceApplication.class, args);
        }


        @Bean
        @LoadBalanced
        public RestTemplate restTemplate() {
            return new RestTemplate();
        }
    }

