"use server"

import nodemailer from "nodemailer"
import { sendTestEmail, type EmailResult } from "./test-email"

// Configure email transporter
let transporter: nodemailer.Transporter

try {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.sendgrid.net",
    port: Number.parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER || "apikey",
      pass: process.env.EMAIL_PASSWORD || "",
    },
  })
} catch (error) {
  console.error("Error creating email transporter:", error)
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  verificationToken: string,
): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const verificationUrl = `${baseUrl}/api/verify?token=${verificationToken}`

  const hasTemplate = !!process.env.EMAIL_TEMPLATE_ID

  const mailOptions = hasTemplate
    ? {
        // Template email
        from: process.env.EMAIL_FROM || '"Fin-Bot" <finb0t@outlook.com>',
        to,
        subject: "Verify Your Fin-Bot Account",
        templateId: process.env.EMAIL_TEMPLATE_ID,
        dynamicTemplateData: {
          firstName: firstName,
          verificationUrl: verificationUrl,
          currentYear: new Date().getFullYear(),
        },
      }
    : {
        // HTML email
        from: process.env.EMAIL_FROM || '"Fin-Bot" <finb0t@outlook.com>',
        to,
        subject: "Verify Your Fin-Bot Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1679c5; padding: 20px; text-align: center; color: white;">
              <h1>Fin-Bot Account Verification</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
              <p>Hello ${firstName},</p>
              <p>Thank you for signing up for Fin-Bot! Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background-color: #1679c5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #1679c5;">${verificationUrl}</p>
              <p>This verification link will expire in 24 hours.</p>
              <p>If you did not create an account, please ignore this email.</p>
              <p>Best regards,<br>The Fin-Bot Team</p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666;">
              <p>© ${new Date().getFullYear()} Fin-Bot. All rights reserved.</p>
            </div>
          </div>
        `,
      }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log("Verification email sent:", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Error sending verification email:", error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(to: string, firstName: string, resetCode: string): Promise<EmailResult> {
  try {
    console.log("Attempting to send password reset email to:", to, "with code:", resetCode)

    const currentYear = new Date().getFullYear()

    // Check if we have a valid transporter and required credentials
    if (!transporter || !process.env.EMAIL_PASSWORD) {
      console.log("No valid email configuration found, using test email service")
      const htmlContent = `
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
                    &copy; ${currentYear} Fin-Bot | All Rights Reserved<br>
                    <small>This is an automated message, please do not reply to this email.</small>
                </div>
            </div>
        </body>
        </html>
      `

      const testResult = await sendTestEmail(to, "Reset Your Fin-Bot Password", htmlContent)

      if (testResult.success) {
        console.log("Test password reset email sent. Preview URL:", testResult.previewUrl)
        console.log("Test account credentials:", testResult.testAccount)
      }

      return testResult
    }

    const RESET_TEMPLATE_ID = "d-858a0ae59c364383a2bca8a4aa9ac46d"

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Fin-Bot" <finb0t@outlook.com>',
      to,
      subject: "Reset Your Fin-Bot Password",
      templateId: RESET_TEMPLATE_ID,
      dynamicTemplateData: {
        firstName: firstName,
        resetCode: resetCode,
        currentYear: currentYear,
      },
    }

    // Log email configuration for debugging
    console.log("Email configuration:", {
      host: process.env.EMAIL_HOST || "smtp.sendgrid.net",
      port: Number.parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "apikey",
        pass: process.env.EMAIL_PASSWORD ? "REDACTED" : "NOT SET",
      },
      templateId: RESET_TEMPLATE_ID,
    })

    const info = await transporter.sendMail(mailOptions)
    console.log("Password reset email sent:", info.messageId)
    return { success: true }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return { success: false, error }
  }
}



