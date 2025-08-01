import {sendEmail} from './send-email';

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string,
): Promise<void> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Stashl.ink account.</p>
      <p>Click the link below to reset your password:</p>
      <p>
        <a href="${resetUrl}" style="background-color: #007cba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this password reset, you can safely ignore this email.</p>
    </div>
  `;

  const text = `
    Password Reset Request

    You requested a password reset for your Stashl.ink account.

    Visit this link to reset your password: ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request this password reset, you can safely ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: 'Reset your Stashl.ink password',
    html,
    text,
  });
}