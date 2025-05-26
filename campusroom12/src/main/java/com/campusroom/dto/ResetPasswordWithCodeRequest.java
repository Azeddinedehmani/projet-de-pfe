package com.campusroom.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ResetPasswordWithCodeRequest {
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 5, max = 5)
    private String verificationCode;
    
    @NotBlank
    @Size(min = 6)
    private String password;
    
    @NotBlank
    @Size(min = 6)
    private String confirmPassword;
    
    public ResetPasswordWithCodeRequest() {}
    
    public ResetPasswordWithCodeRequest(String email, String verificationCode, String password, String confirmPassword) {
        this.email = email;
        this.verificationCode = verificationCode;
        this.password = password;
        this.confirmPassword = confirmPassword;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getVerificationCode() {
        return verificationCode;
    }
    
    public void setVerificationCode(String verificationCode) {
        this.verificationCode = verificationCode;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getConfirmPassword() {
        return confirmPassword;
    }
    
    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }
}