//testing page for email verification for users when signing up
"use server"

import nodemailer from "nodemailer"

interface TestAccount {
  user: string
  pass: string
}

export interface EmailResult {
  success: boolean
  previewUrl?: string | false
  testAccount?: TestAccount
  error?: Error | string | unknown 
}

export async function createTestAccount() {
  try {
    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount()

    console.log("Created test email account:", testAccount.user)

    // Create a transporter object using the test account
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    return { transporter, testAccount }
  } catch (error) {
    console.error("Error creating test email account:", error)
    throw error
  }
}

// Function to send a test email and return the preview URL
export async function sendTestEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  try {
    const { transporter, testAccount } = await createTestAccount()

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Fin-Bot Test" <test@finbot.com>',
      to,
      subject,
      html,
    })

    console.log("Test email sent:", info.messageId)
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info))

    return {
      success: true,
      previewUrl: nodemailer.getTestMessageUrl(info),
      testAccount,
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return { success: false, error }
  }
}

