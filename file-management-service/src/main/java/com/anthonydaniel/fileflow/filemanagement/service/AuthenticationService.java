package com.anthonydaniel.fileflow.filemanagement.service;

import com.anthonydaniel.fileflow.filemanagement.dto.TokenValidationResponse;
import org.springframework.cloud.client.loadbalancer.LoadBalancerClient;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class AuthenticationService {

    private final RestTemplate restTemplate;
    private final LoadBalancerClient loadBalancerClient;

    public AuthenticationService(RestTemplate metadataRestTemplate,
                                 LoadBalancerClient loadBalancerClient) {
        this.restTemplate = metadataRestTemplate;
        this.loadBalancerClient = loadBalancerClient;
    }

    // validates token through the auth-service
    public TokenValidationResponse validateToken(String token) {
        String serviceUrl = loadBalancerClient.choose("AUTH-SERVICE")
                .getUri().toString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", token);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        ResponseEntity<TokenValidationResponse> response = restTemplate.exchange(
                serviceUrl + "/auth/validate-token",
                HttpMethod.POST,
                entity,
                TokenValidationResponse.class
        );

        return response.getBody();
    }
}