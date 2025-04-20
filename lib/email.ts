import sgMail from "@sendgrid/mail"
import type { EmailOptions, EmailResponse } from "../app/types/auth"

if (!process.env.EMAIL_PASSWORD) {
  throw new Error("SendGrid API key is not set in environment variables")
}

sgMail.setApiKey(process.env.EMAIL_PASSWORD)

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<EmailResponse> {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM || "fin-b0t@outlook.com",
      subject,
      text,
      html: html || text,
    }

    await sgMail.send(msg)
    console.log("✅ Email sent successfully to:", to)
    return { success: true, message: "Email sent successfully" }
  } catch (error) {
    console.error("❌ Error sending email:", error)
    return {
      success: false,
      message: "Failed to send email",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  verificationCode: string,
): Promise<EmailResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1679c5; padding: 20px; text-align: center; color: white;">
        <h1>Fin-Bot Account Verification</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
        <p>Hello ${firstName},</p>
        <p>Thank you for signing up for Fin-Bot! Please use the following code to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background-color: #f5f5f5; border-radius: 8px;">
            ${verificationCode}
          </div>
        </div>
        <p>This verification code will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Best regards,<br>The Fin-Bot Team</p>
      </div>
      <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
        <p>© ${new Date().getFullYear()} Fin-Bot. All rights reserved.</p>
      </div>
    </div>
  `

  return await sendEmail({
    to,
    subject: "Verify Your Fin-Bot Account",
    text: `Your Fin-Bot verification code is: ${verificationCode}`,
    html,
  })
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetCode: string): Promise<EmailResponse> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 100%;
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .header {
                font-size: 24px;
                font-weight: bold;
                color: #1679c5;
            }
            .code {
                font-size: 28px;
                font-weight: bold;
                color: #333;
                background: #f8f9fa;
                padding: 10px 20px;
                display: inline-block;
                border-radius: 6px;
                margin: 20px 0;
                letter-spacing: 5px;
            }
            .instructions {
                color: #555;
                line-height: 1.5;
                margin-bottom: 20px;
            }
            .warning {
                color: #e74c3c;
                font-size: 13px;
                margin-top: 15px;
            }
            .footer {
                font-size: 12px;
                color: #777777;
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #eeeeee;
            }
            .logo {
                margin-bottom: 20px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 36px;
                font-weight: 700;
                color: #7C3AED;
                letter-spacing: -0.5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">
                Fin-Bot
            </div>
            <div class="header">Password Reset Request</div>
            <p>Hello <strong>${firstName}</strong>,</p>
            <p class="instructions">We received a request to reset your password for your Fin-Bot account. Use the following code to complete the password reset process:</p>
            <div class="code">${resetCode}</div>
            <p class="instructions">This code will expire in 15 minutes for security reasons.</p>
            <p class="instructions">If you didn't request a password reset, please ignore this email or contact our support team if you believe this is suspicious activity.</p>
            <p class="warning">Never share this code with anyone.</p>
            <div class="footer">
                &copy; ${new Date().getFullYear()} Fin-Bot | All Rights Reserved<br>
                <small>This is an automated message, please do not reply to this email.</small>
            </div>
        </div>
    </body>
    </html>
  `

  try {
    await sendEmail({
      to,
      subject: "Reset Your Fin-Bot Password",
      text: `Your reset code is: ${resetCode}`,
      html,
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

