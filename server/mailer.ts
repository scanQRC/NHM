import nodemailer from 'nodemailer';

export interface OutboundEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type MailDispatchFn = (payload: OutboundEmailPayload) => Promise<void>;

export function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.SMTP_FROM?.trim()
  );
}

export function createSmtpMailSender(): MailDispatchFn {
  return async (payload: OutboundEmailPayload) => {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    const from = process.env.SMTP_FROM?.trim();
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure =
      process.env.SMTP_SECURE !== undefined
        ? process.env.SMTP_SECURE.toLowerCase() === 'true'
        : port === 465;

    if (!host || !user || !pass || !from) {
      throw new Error('SMTP_NOT_CONFIGURED');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {user, pass},
    });

    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  };
}

export function buildLoginOtpEmail(to: string, otp: string, ttlMinutes = 10): OutboundEmailPayload {
  return {
    to,
    subject: 'National Medical Hall Admin — 6-Digit Login Verification Code',
    text: [
      'National Medical Hall (NMH) Private Dispensary Admin Portal',
      '',
      `Your 6-digit login verification code is: ${otp}`,
      '',
      `This code expires in ${ttlMinutes} minutes and can only be used once.`,
      'If you did not attempt to sign in, rotate your Main Admin password immediately.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0F172A;">
        <h2 style="color: #102B50; margin-bottom: 8px;">National Medical Hall (NMH)</h2>
        <p style="font-size: 14px; color: #475569;">Private Dispensary Admin Portal — 2-Step Verification</p>
        <div style="background: #F4F7FB; border: 1px solid #CBD5E1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">6-Digit Verification OTP</div>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #102B50; font-family: monospace;">${otp}</div>
        </div>
        <p style="font-size: 13px; color: #475569;">
          This code expires in <strong>${ttlMinutes} minutes</strong> and can only be used once.
          No account is ever created automatically through OTP verification.
        </p>
      </div>
    `,
  };
}

export function buildOwnerTransferOtpEmail(
  newEmail: string,
  oldEmail: string,
  otp: string,
  ttlMinutes = 10
): OutboundEmailPayload {
  return {
    to: newEmail,
    subject: 'National Medical Hall — Verify New Main Admin Owner Email',
    text: [
      'National Medical Hall (NMH) Owner Email Transfer',
      '',
      `A request was made by the authenticated Main Admin (${oldEmail}) to transfer primary ownership to ${newEmail}.`,
      `Your 6-digit confirmation code is: ${otp}`,
      '',
      `This code expires in ${ttlMinutes} minutes.`,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0F172A;">
        <h2 style="color: #102B50; margin-bottom: 8px;">National Medical Hall (NMH)</h2>
        <p style="font-size: 14px; color: #475569;">
          Confirm Main Admin email replacement from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>:
        </p>
        <div style="background: #F4F7FB; border: 1px solid #CBD5E1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #12A66A; font-family: monospace;">${otp}</div>
        </div>
        <p style="font-size: 13px; color: #475569;">Expires in ${ttlMinutes} minutes.</p>
      </div>
    `,
  };
}

export function buildPasswordResetOtpEmail(
  to: string,
  otp: string,
  ttlMinutes = 10
): OutboundEmailPayload {
  return {
    to,
    subject: 'National Medical Hall Admin — Password Reset Verification Code',
    text: [
      'National Medical Hall (NMH) Password Reset',
      '',
      `Your 6-digit password reset code is: ${otp}`,
      `Expires in ${ttlMinutes} minutes.`,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0F172A;">
        <h2 style="color: #102B50;">National Medical Hall (NMH)</h2>
        <p style="font-size: 14px; color: #475569;">Use the 6-digit code below to reset your password:</p>
        <div style="background: #F4F7FB; border: 1px solid #CBD5E1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1769D2; font-family: monospace;">${otp}</div>
        </div>
        <p style="font-size: 13px; color: #475569;">Expires in ${ttlMinutes} minutes.</p>
      </div>
    `,
  };
}

export function buildStaffInviteEmail(
  to: string,
  displayName: string,
  inviteUrl: string
): OutboundEmailPayload {
  return {
    to,
    subject: 'National Medical Hall — Authorized Staff Account Invitation',
    text: [
      `Hello ${displayName},`,
      '',
      'The Main Administrator of National Medical Hall (Udhampur) has invited you to activate an authorized staff account.',
      `Open this one-time invitation link within 48 hours to set your password:\n${inviteUrl}`,
      '',
      'Note: Sign-in requires both your password and a 6-digit email OTP.',
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; color: #0F172A;">
        <h2 style="color: #102B50;">National Medical Hall (NMH)</h2>
        <p style="font-size: 14px; color: #334155;">Hello <strong>${displayName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">
          The Main Administrator has authorized your staff account. Use the one-time invitation link below within 48 hours to set your password:
        </p>
        <p style="margin: 20px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: #1769D2; color: #FFFFFF; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Accept Staff Invitation
          </a>
        </p>
        <p style="font-size: 12px; color: #64748B; word-break: break-all;">${inviteUrl}</p>
      </div>
    `,
  };
}
