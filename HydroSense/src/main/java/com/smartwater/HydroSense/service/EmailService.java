package com.smartwater.HydroSense.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.smartwater.HydroSense.entity.WaterQualityReading;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@hydrosense.com}")
    private String fromEmail;

    /**
     * Send alert email asynchronously
     */
    @Async
    public void sendAlertEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("[HydroSense] " + subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Alert email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send a simple text email
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("[HydroSense] " + subject);
            helper.setText(text);

            mailSender.send(message);
            log.info("Simple email sent to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send simple email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send welcome email to new users
     */
    @Async
    public void sendWelcomeEmail(String to, String fullName, String role) {
        String subject = "Welcome to HydroSense! 💧";

        // Note: In CSS within String.format, use '%%' to represent a literal '%'
        // symbol.
        String content = String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                                .container { width: 100%%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                                .header { background-color: #0077b6; padding: 30px; text-align: center; }
                                .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
                                .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                                .role-box { background-color: #e0f7fa; border-left: 5px solid #0077b6; padding: 15px; margin: 20px 0; border-radius: 4px; color: #006064; }
                                .btn { display: inline-block; padding: 12px 24px; background-color: #0077b6; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
                                .footer { background-color: #f4f7f6; padding: 20px; text-align: center; font-size: 12px; color: #888888; }
                            </style>
                        </head>
                        <body>
                            <br><br>
                            <div class="container">
                                <div class="header">
                                    <h1>HydroSense</h1>
                                </div>

                                <div class="content">
                                    <h2>Hello, %s! 👋</h2>
                                    <p>Welcome to the <strong>HydroSense</strong> community. We are thrilled to have you onboard our Smart Water Quality Monitoring System.</p>

                                    <p>Your account has been successfully configured.</p>

                                    <div class="role-box">
                                        <strong>Current Access Role:</strong> %s
                                    </div>

                                    <p>You will now start receiving real-time water quality alerts tailored to your preferences.</p>

                                    <center>
                                        <a href="#" class="btn">Go to My Dashboard</a>
                                    </center>
                                </div>

                                <div class="footer">
                                    <p>Stay safe and stay informed.</p>
                                    <p>&copy; 2024 HydroSense Team<br>
                                    <a href="#" style="color: #888888;">Unsubscribe</a> | <a href="#" style="color: #888888;">Support</a></p>
                                </div>
                            </div>
                            <br><br>
                        </body>
                        </html>
                        """,
                fullName, role);

        sendAlertEmail(to, subject, content);
    }

    /**
     * Send OTP email for password reset
     */
    @Async
    public void sendOtpEmail(String to, String otp, String name) {
        String subject = "🔑 Password Reset OTP";
        String content = String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                        </head>
                        <body style="font-family: Arial, sans-serif; background-color: #f4f7f6; padding: 20px;">
                            <div style="max-width: 500px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; text-align: center;">
                                <h2 style="color: #0077b6;">HydroSense</h2>
                                <p>Hello %s,</p>
                                <p>You requested a password reset. Use the OTP below to proceed:</p>
                                <h1 style="background: #e1f5fe; color: #0277bd; padding: 15px; border-radius: 5px; letter-spacing: 5px;">%s</h1>
                                <p>This OTP is valid for 10 minutes.</p>
                                <p style="color: #888; font-size: 12px;">If you didn't request this, ignore this email.</p>
                            </div>
                        </body>
                        </html>
                        """,
                name, otp);

        sendAlertEmail(to, subject, content);
        log.info("OTP email sent to: {}", to);
    }

    /**
     * Send pollution alert email to citizens with water quality parameters
     */
    @Async
    public void sendPollutionAlert(String to, WaterQualityReading reading) {
        String subject = "⚠️ Water Pollution Alert - Immediate Action Required";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
        String recordedTime = reading.getRecordedAt() != null
                ? reading.getRecordedAt().format(formatter)
                : "N/A";

        String content = String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                                .container { width: 100%%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                                .header { background-color: #dc3545; padding: 30px; text-align: center; }
                                .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
                                .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
                                .alert-box { background-color: #fff3cd; border-left: 5px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px; color: #856404; }
                                .params-table { width: 100%%; border-collapse: collapse; margin: 20px 0; }
                                .params-table th, .params-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                                .params-table th { background-color: #f8f9fa; color: #333; }
                                .params-table tr:hover { background-color: #f5f5f5; }
                                .footer { background-color: #f4f7f6; padding: 20px; text-align: center; font-size: 12px; color: #888888; }
                            </style>
                        </head>
                        <body>
                            <br><br>
                            <div class="container">
                                <div class="header">
                                    <h1>⚠️ Water Pollution Alert</h1>
                                </div>

                                <div class="content">
                                    <h2>Dear Citizen,</h2>
                                    <p>Our monitoring system has detected <strong>high pollution levels</strong> in your area's water supply. Please take immediate precautions.</p>

                                    <div class="alert-box">
                                        <strong>⚠️ Warning:</strong> Water is currently NOT SAFE for drinking or direct consumption. Please use bottled water or boil water before use.
                                    </div>

                                    <h3>Water Quality Parameters</h3>
                                    <table class="params-table">
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Value</th>
                                            <th>Unit</th>
                                        </tr>
                                        <tr>
                                            <td>Temperature</td>
                                            <td>%.2f</td>
                                            <td>°C</td>
                                        </tr>
                                        <tr>
                                            <td>pH Level</td>
                                            <td>%.2f</td>
                                            <td>-</td>
                                        </tr>
                                        <tr>
                                            <td>TDS (Total Dissolved Solids)</td>
                                            <td>%.2f</td>
                                            <td>ppm</td>
                                        </tr>
                                        <tr>
                                            <td>Turbidity</td>
                                            <td>%.2f</td>
                                            <td>NTU</td>
                                        </tr>
                                        <tr>
                                            <td>Dissolved Oxygen</td>
                                            <td>%.2f</td>
                                            <td>mg/L</td>
                                        </tr>
                                    </table>

                                    <p><strong>Recorded At:</strong> %s</p>
                                    <p><strong>Location:</strong> Lat: %.6f, Lng: %.6f</p>

                                    <p>Authorities have been notified and are working to resolve the issue. You will receive an update once the water quality returns to safe levels.</p>
                                </div>

                                <div class="footer">
                                    <p>Stay safe and stay informed.</p>
                                    <p>&copy; 2024 HydroSense Team<br>
                                    <a href="#" style="color: #888888;">Unsubscribe</a> | <a href="#" style="color: #888888;">Support</a></p>
                                </div>
                            </div>
                            <br><br>
                        </body>
                        </html>
                        """,
                reading.getTemperature(),
                reading.getPh(),
                reading.getTds(),
                reading.getTurbidity(),
                reading.getDissolvedOxygen(),
                recordedTime,
                reading.getLatitude(),
                reading.getLongitude());

        sendAlertEmail(to, subject, content);
        log.info("Pollution alert email sent to: {}", to);
    }

}
