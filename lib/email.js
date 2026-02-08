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
const ADMIN_EMAIL = 'srirubankumar@gmail.com';
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

/**
 * Send Enquiry Email - Sends to Admin and Confirmation to Client
 */
export async function sendEnquiryEmail(name, email, phone, message) {
  // Email to Admin
  const adminMailOptions = {
    from: `"${APP_NAME} Enquiry" <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `📩 New Enquiry from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">New Enquiry Received!</h1>
        </div>
        <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Contact Details:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 100px;">Name:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Email:</td>
              <td style="padding: 8px 0; color: #1e293b;"><a href="mailto:${email}" style="color: #3B82F6;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Phone:</td>
              <td style="padding: 8px 0; color: #1e293b;">${phone || 'Not provided'}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
          <h3 style="color: #1e293b;">Message:</h3>
          <p style="color: #475569; line-height: 1.6; background: #f1f5f9; padding: 16px; border-radius: 8px;">${message}</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
            Received on: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    `,
  };

  // Confirmation Email to Client
  const clientMailOptions = {
    from: `"${APP_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: `Thank you for contacting ${APP_NAME}! ✨`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 24px; border-radius: 12px; text-align: center;">
          <h1 style="color: white; margin: 0;">Thank You! 🙏</h1>
        </div>
        <div style="padding: 24px;">
          <p style="color: #1e293b; font-size: 16px;">Hi ${name},</p>
          <p style="color: #475569; line-height: 1.6;">
            Thank you for reaching out to us! We have received your enquiry and our team will get back to you within 24-48 hours.
          </p>
          <div style="background: #f0f9ff; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #1e293b; font-weight: bold; margin: 0 0 8px 0;">Your Message:</p>
            <p style="color: #64748b; margin: 0; font-style: italic;">"${message}"</p>
          </div>
          <p style="color: #475569;">In the meantime, feel free to explore our platform:</p>
          <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin-top: 12px; font-weight: bold;">
            Visit MoneyMind
          </a>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
            Best regards,<br>The MoneyMind Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(clientMailOptions),
    ]);
    console.log('Enquiry emails sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending enquiry email:', error);
    return false;
  }
}

