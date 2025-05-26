package com.campusroom.controller;

import com.campusroom.dto.*;
import com.campusroom.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
// Add these imports to AuthController.java
import com.campusroom.dto.VerifyCodeRequest;
import com.campusroom.dto.ResetPasswordWithCodeRequest;


@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;
    
    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(authResponse);
    }
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponse authResponse = authService.registerUser(registerRequest);
        return ResponseEntity.ok(authResponse);
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        AuthResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        AuthResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/reset-all-passwords")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AuthResponse> resetAllPasswords() {
        AuthResponse response = authService.resetPasswordForAllUsers();
        return ResponseEntity.ok(response);
    }
    
    
@PostMapping("/verify-code")
public ResponseEntity<AuthResponse> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
    AuthResponse response = authService.verifyCode(request);
    return ResponseEntity.ok(response);
}

@PostMapping("/reset-password-with-code")
public ResponseEntity<AuthResponse> resetPasswordWithCode(@Valid @RequestBody ResetPasswordWithCodeRequest request) {
    AuthResponse response = authService.resetPasswordWithCode(request);
    return ResponseEntity.ok(response);
}
}