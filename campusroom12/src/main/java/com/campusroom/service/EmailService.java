package com.campusroom.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.campusroom.model.User;
import java.util.List;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    public boolean sendPasswordResetEmail(String to, String token) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Réinitialisation de mot de passe");
            message.setText("Pour réinitialiser votre mot de passe, veuillez cliquer sur ce lien: " +
                          "http://localhost:3000/reset-password?token=" + token);
            
            logger.info("Tentative d'envoi d'email à: {}", to);
            mailSender.send(message);
            logger.info("Email envoyé avec succès à: {}", to);
            return true;
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi d'email à {}: {}", to, e.getMessage(), e);
            return false;
        }
    }
    
    public boolean sendVerificationCodeEmail(String to, String verificationCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Code de vérification - Réinitialisation de mot de passe");
            message.setText("Votre code de vérification pour réinitialiser votre mot de passe est: " + 
                          verificationCode + 
                          "\n\nCe code expire dans 15 minutes." +
                          "\n\nSi vous n'avez pas demandé cette réinitialisation, ignorez cet email.");
            
            logger.info("Tentative d'envoi du code de vérification à: {}", to);
            mailSender.send(message);
            logger.info("Code de vérification envoyé avec succès à: {}", to);
            return true;
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi du code de vérification à {}: {}", to, e.getMessage(), e);
            return false;
        }
    }
    
    public int sendBulkPasswordResetEmails(List<User> users) {
        int successCount = 0;
        for (User user : users) {
            if (sendPasswordResetEmail(user.getEmail(), user.getResetToken())) {
                successCount++;
            }
        }
        return successCount;
    }
}