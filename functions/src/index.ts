import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const smtpEmail = defineSecret("SMTP_EMAIL");
const smtpPassword = defineSecret("SMTP_PASSWORD");

export const onOtpCreated = onDocumentWritten(
  {
    document: "otps/{userId}",
    secrets: [smtpEmail, smtpPassword],
    region: "asia-southeast1",
  },
  async (event) => {
    const data = event.data?.after?.data();

    // Document deleted → ignore
    if (!data) return;

    const userId = event.params.userId;
    const code: string = data.code;
    const expiresAt = data.expiresAt?.toDate();

    if (!code) {
      logger.warn(`OTP document for ${userId} has no code, skipping.`);
      return;
    }

    // Already sent email for this code → skip
    if (data.emailSent === true) {
      logger.info(`Email already sent for ${userId}, skipping.`);
      return;
    }

    // Read user email from /users/{userId}
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.data();
    const userEmail = userData?.email;
    const fullName = userData?.fullName || "Phụ huynh";

    if (!userEmail) {
      logger.error(`No email found for user ${userId}, cannot send OTP.`);
      return;
    }

    // Format expiry time
    const expiryStr = expiresAt
      ? `${expiresAt.getHours().toString().padStart(2, "0")}:${expiresAt.getMinutes().toString().padStart(2, "0")}`
      : "30 phút";

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpEmail.value(),
        pass: smtpPassword.value(),
      },
    });

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6C63FF,#4ECDC4);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                🛡️ Xác thực tài khoản
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">
                Project HA
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.6;">
                Xin chào <strong>${fullName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                Đây là mã xác thực tài khoản của bạn. Vui lòng nhập mã bên dưới vào ứng dụng để hoàn tất đăng ký:
              </p>

              <!-- OTP Code -->
              <div style="text-align:center;margin:24px 0;">
                <div style="display:inline-block;background:#f0f0ff;border:2px dashed #6C63FF;border-radius:12px;padding:20px 40px;">
                  <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#6C63FF;">
                    ${code}
                  </span>
                </div>
              </div>

              <p style="margin:24px 0 8px;color:#888;font-size:13px;text-align:center;">
                ⏰ Mã có hiệu lực đến <strong>${expiryStr}</strong>
              </p>
              <p style="margin:0 0 24px;color:#888;font-size:13px;text-align:center;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
              </p>

              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

              <p style="margin:0;color:#aaa;font-size:12px;text-align:center;line-height:1.5;">
                Email này được gửi tự động từ Project HA.<br>
                Vui lòng không trả lời email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email
    const mailOptions = {
      from: `"Project HA" <${smtpEmail.value()}>`,
      to: userEmail,
      subject: `[${code}] Mã xác thực tài khoản Project HA`,
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`✅ OTP email sent to ${userEmail} for user ${userId}`);

      // Mark as sent to avoid duplicate emails
      await event.data!.after!.ref.update({ emailSent: true });
    } catch (err) {
      logger.error(`❌ Failed to send OTP email to ${userEmail}:`, err);
      throw err;
    }
  }
);
