import nodemailer from 'nodemailer';

/**
 * Email Configuration
 * Uses Gmail SMTP by default. Update .env for other providers.
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.SMTP_USER || 'noreply@moneymind.app';
const APP_NAME = 'MoneyMind';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Send Welcome Email on Registration
 */
export async function sendWelcomeEmail(email, name) {
  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3B82F6;">Welcome to ${APP_NAME}!</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Thank you for joining MoneyMind! Your account has been created successfully.</p>
        <p>With MoneyMind, you can:</p>
        <ul>
          <li>Track your income and expenses</li>
          <li>Monitor your financial health score</li>
          <li>Get smart suggestions to improve your finances</li>
          <li>View detailed reports and analytics</li>
        </ul>
        <a href="${APP_URL}/dashboard" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 16px;">
          Go to Dashboard
        </a>
        <p style="margin-top: 24px; color: #666;">Happy budgeting! 💰</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}

/**
 * Send Password Reset Email
 */
export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `Reset Your ${APP_NAME} Password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3B82F6;">Password Reset Request</h1>
        <p>We received a request to reset your password for your ${APP_NAME} account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">If the button doesn't work, copy and paste this link: ${resetUrl}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}
