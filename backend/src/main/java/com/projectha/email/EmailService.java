package com.projectha.email;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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
        String subject = "[" + code + "] Mã xác thực tài khoản Project HA";
        String htmlContent = buildEmailTemplate(
            "Xác thực tài khoản - Project HA",
            "Xác thực email của bạn",
            "Xin chào <strong>" + fullName + "</strong>,<br><br>Chào mừng bạn đến với Project HA! Vui lòng sử dụng mã xác thực dưới đây để hoàn tất việc đăng ký tài khoản:",
            code,
            "Mã xác thực có hiệu lực trong vòng <strong>30 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai để bảo vệ tài khoản của bạn."
        );
        sendHtml(to, subject, htmlContent);
    }

    public void sendPasswordResetCode(String to, String fullName, String code) {
        String subject = "[" + code + "] Mã đặt lại mật khẩu Project HA";
        String htmlContent = buildEmailTemplate(
            "Đặt lại mật khẩu - Project HA",
            "Đặt lại mật khẩu",
            "Xin chào <strong>" + fullName + "</strong>,<br><br>Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn. Vui lòng sử dụng mã đặt lại mật khẩu dưới đây để tiếp tục:",
            code,
            "Mã đặt lại mật khẩu có hiệu lực trong vòng <strong>30 phút</strong>. Nếu bạn không yêu cầu thay đổi này, hãy bỏ qua email này."
        );
        sendHtml(to, subject, htmlContent);
    }

    private void sendHtml(String to, String subject, String htmlContent) {
        if (to == null || to.isBlank()) return;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (Exception e) {
            // Fallback to simple logs or handle gracefully
            e.printStackTrace();
        }
    }

    private String buildEmailTemplate(String title, String heading, String description, String code, String note) {
        return "<!DOCTYPE html>\n" +
               "<html>\n" +
               "<head>\n" +
               "  <meta charset=\"utf-8\">\n" +
               "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
               "  <title>" + title + "</title>\n" +
               "  <style>\n" +
               "    body {\n" +
               "      font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif;\n" +
               "      background-color: #F7FAF5;\n" +
               "      color: #25323A;\n" +
               "      margin: 0;\n" +
               "      padding: 0;\n" +
               "      -webkit-font-smoothing: antialiased;\n" +
               "    }\n" +
               "    .wrapper {\n" +
               "      width: 100%;\n" +
               "      background-color: #F7FAF5;\n" +
               "      padding: 40px 20px;\n" +
               "    }\n" +
               "    .container {\n" +
               "      max-width: 480px;\n" +
               "      margin: 0 auto;\n" +
               "      background-color: #ffffff;\n" +
               "      border-radius: 24px;\n" +
               "      padding: 40px 32px;\n" +
               "      box-shadow: 0 8px 24px rgba(88, 204, 2, 0.05), 0 2px 6px rgba(0, 0, 0, 0.01);\n" +
               "      border: 1px solid #E5E7EB;\n" +
               "    }\n" +
               "    .logo-container {\n" +
               "      text-align: center;\n" +
               "      margin-bottom: 24px;\n" +
               "    }\n" +
               "    .logo {\n" +
               "      display: inline-block;\n" +
               "      width: 64px;\n" +
               "      height: 64px;\n" +
               "      line-height: 64px;\n" +
               "      background-color: #FFC800;\n" +
               "      border-radius: 20px;\n" +
               "      font-size: 32px;\n" +
               "      text-align: center;\n" +
               "      box-shadow: 0 6px 16px rgba(255, 200, 0, 0.25);\n" +
               "    }\n" +
               "    h1 {\n" +
               "      font-size: 22px;\n" +
               "      font-weight: 800;\n" +
               "      color: #25323A;\n" +
               "      margin: 0 0 16px 0;\n" +
               "      text-align: center;\n" +
               "    }\n" +
               "    .desc {\n" +
               "      font-size: 15px;\n" +
               "      line-height: 1.6;\n" +
               "      color: #4B5563;\n" +
               "      margin: 0 0 28px 0;\n" +
               "      text-align: left;\n" +
               "    }\n" +
               "    .code-container {\n" +
               "      text-align: center;\n" +
               "      margin: 28px 0;\n" +
               "    }\n" +
               "    .code-box {\n" +
               "      display: inline-block;\n" +
               "      font-family: Consolas, \"Courier New\", Courier, monospace;\n" +
               "      font-size: 32px;\n" +
               "      font-weight: 800;\n" +
               "      letter-spacing: 6px;\n" +
               "      color: #58CC02;\n" +
               "      background-color: #F0FDF4;\n" +
               "      padding: 14px 28px;\n" +
               "      border-radius: 16px;\n" +
               "      border: 2px dashed #58CC02;\n" +
               "    }\n" +
               "    .note {\n" +
               "      font-size: 13px;\n" +
               "      line-height: 1.5;\n" +
               "      color: #9CA3AF;\n" +
               "      text-align: left;\n" +
               "      margin-top: 28px;\n" +
               "      border-top: 1px solid #F0F2F5;\n" +
               "      padding-top: 20px;\n" +
               "    }\n" +
               "    .footer {\n" +
               "      text-align: center;\n" +
               "      margin-top: 24px;\n" +
               "      font-size: 12px;\n" +
               "      color: #9CA3AF;\n" +
               "    }\n" +
               "  </style>\n" +
               "</head>\n" +
               "<body>\n" +
               "  <div class=\"wrapper\">\n" +
               "    <div class=\"container\">\n" +
               "      <div class=\"logo-container\">\n" +
               "        <div class=\"logo\">✨</div>\n" +
               "      </div>\n" +
               "      <h1>" + heading + "</h1>\n" +
               "      <div class=\"desc\">" + description + "</div>\n" +
               "      <div class=\"code-container\">\n" +
               "        <div class=\"code-box\">" + code + "</div>\n" +
               "      </div>\n" +
               "      <div class=\"note\">\n" +
               "        " + note + "\n" +
               "      </div>\n" +
               "      <div style=\"text-align: center; margin-top: 24px;\">\n" +
               "        <p style=\"font-size: 13px; color: #9CA3AF; margin: 0;\">Trân trọng,<br>Đội ngũ Project HA</p>\n" +
               "      </div>\n" +
               "      <div class=\"note\" style=\"border-top: none; padding-top: 0; text-align: center; margin-top: 12px;\">\n" +
               "        <small>Đây là email tự động, vui lòng không phản hồi trực tiếp email này.</small>\n" +
               "      </div>\n" +
               "    </div>\n" +
               "    <div class=\"footer\">\n" +
               "      &copy; 2026 Project HA. All rights reserved.\n" +
               "    </div>\n" +
               "  </div>\n" +
               "</body>\n" +
               "</html>";
    }
}

