package com.campusroom.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class VerifyCodeRequest {
    
    @NotBlank
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 5, max = 5)
    private String verificationCode;
    
    public VerifyCodeRequest() {}
    
    public VerifyCodeRequest(String email, String verificationCode) {
        this.email = email;
        this.verificationCode = verificationCode;
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
}