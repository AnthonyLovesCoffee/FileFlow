package com.anthonydaniel.fileflow.auth.service;

import com.anthonydaniel.fileflow.auth.jwt.JwtTokenProvider;
import com.anthonydaniel.fileflow.auth.model.AuthResponse;
import com.anthonydaniel.fileflow.auth.model.LoginRequest;
import com.anthonydaniel.fileflow.auth.model.RegisterRequest;
import com.anthonydaniel.fileflow.auth.model.User;
import com.anthonydaniel.fileflow.auth.repository.UserRepository;
import org.h2.engine.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.naming.AuthenticationException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthenticationService {
    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public AuthResponse authenticate(LoginRequest request) throws AuthenticationException {
        // check user credentials
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("User not found"));

        // verify user password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthenticationException("Invalid credentials");
        }

        // creating JWT token
        String token = tokenProvider.createToken(
                user.getEmail(),
                user.getRoles()
        );

        // returning response with token
        return new AuthResponse(token, user.getId());
    }

    public void register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(List.of("ROLE_USER")); // Default role

        userRepository.save(user);
    }
}