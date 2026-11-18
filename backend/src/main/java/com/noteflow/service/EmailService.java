package com.noteflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    // Optional - won't fail startup if mail is not configured
    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@noteflow.com}")
    private String fromEmail;

    @Value("${noteflow.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Async
    public void sendEmailVerification(String toEmail, String username, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("Verify your NoteFlow email");
                message.setText("Hi " + username + ",\n\nVerify your email:\n\n" + link
                        + "\n\nThis link expires in 24 hours.\n\nNoteFlow Team");
                mailSender.send(message);
                log.info("Verification email sent to: {}", toEmail);
            } catch (Exception e) {
                log.warn("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            }
        } else {
            log.info("[DEV] Email verification link for {}: {}", toEmail, link);
        }
    }

    @Async
    public void sendPasswordReset(String toEmail, String username, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject("Reset your NoteFlow password");
                message.setText("Hi " + username + ",\n\nReset your password:\n\n" + link
                        + "\n\nExpires in 1 hour.\n\nNoteFlow Team");
                mailSender.send(message);
            } catch (Exception e) {
                log.warn("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            }
        } else {
            log.info("[DEV] Password reset link for {}: {}", toEmail, link);
        }
    }

    @Async
    public void sendInvitation(String toEmail, String inviterName, String resourceType,
                               String resourceName, String inviteLink) {
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(toEmail);
                message.setSubject(inviterName + " invited you to collaborate on NoteFlow");
                message.setText("Hi,\n\n" + inviterName + " shared the " + resourceType.toLowerCase()
                        + " \"" + resourceName + "\" with you.\n\nAccept here:\n\n" + inviteLink
                        + "\n\nExpires in 7 days.\n\nNoteFlow Team");
                mailSender.send(message);
            } catch (Exception e) {
                log.warn("Failed to send invitation email to {}: {}", toEmail, e.getMessage());
            }
        } else {
            log.info("[DEV] Invitation link for {}: {}", toEmail, inviteLink);
        }
    }
}
