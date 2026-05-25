package com.projectha.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final String from;

    public EmailService(JavaMailSender mailSender, @Value("${project-ha.smtp.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    public void sendVerificationCode(String to, String fullName, String code) {
        send(to, "[" + code + "] Mã xác thực tài khoản Project HA",
            "Xin chào " + fullName + ",\n\nMã xác thực tài khoản Project HA của bạn là: " + code
                + "\nMã có hiệu lực trong 30 phút.\n\nProject HA");
    }

    public void sendPasswordResetCode(String to, String fullName, String code) {
        send(to, "[" + code + "] Mã đặt lại mật khẩu Project HA",
            "Xin chào " + fullName + ",\n\nMã đặt lại mật khẩu của bạn là: " + code
                + "\nMã có hiệu lực trong 30 phút.\n\nProject HA");
    }

    private void send(String to, String subject, String text) {
        if (to == null || to.isBlank()) return;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }
}
