package com.anthonydaniel.fileflow.auth.controller;

import com.anthonydaniel.fileflow.auth.jwt.JwtTokenProvider;
import com.anthonydaniel.fileflow.auth.service.AuthenticationService;
import com.anthonydaniel.fileflow.auth.model.LoginRequest;
import com.anthonydaniel.fileflow.auth.model.RegisterRequest;
import com.anthonydaniel.fileflow.auth.model.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.naming.AuthenticationException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthenticationController(AuthenticationService authenticationService, JwtTokenProvider jwtTokenProvider) {
        this.authenticationService = authenticationService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authenticationService.authenticate(request);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            authenticationService.register(request);
            return ResponseEntity.ok("Registration successful!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", false);
                response.put("message", "Invalid authorization header");
                return ResponseEntity.ok(response);
            }

            String token = authHeader.replace("Bearer ", "");

            if (!jwtTokenProvider.validateToken(token)) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", false);
                response.put("message", "Invalid token");
                return ResponseEntity.ok(response);
            }

            String username = jwtTokenProvider.getUsernameFromToken(token);

            Map<String, Object> response = new HashMap<>();
            response.put("valid", true);
            response.put("username", username);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valid", false);
            response.put("message", "Token validation failed: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}

