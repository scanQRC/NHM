export interface OutboundEmailPayload {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface MailDeliveryResult {
  id: string;
  provider: 'resend';
}

export type MailDispatchFn = (
  payload: OutboundEmailPayload
) => Promise<MailDeliveryResult | void>;

export type ResendErrorCode =
  | 'RESEND_NOT_CONFIGURED'
  | 'RESEND_INVALID_SENDER'
  | 'RESEND_AUTH_FAILED'
  | 'RESEND_RATE_LIMITED'
  | 'RESEND_API_ERROR'
  | 'RESEND_INVALID_RESPONSE'
  | 'RESEND_NETWORK_ERROR';

export class ResendDeliveryError extends Error {
  code: ResendErrorCode;
  httpStatus: number;
  safeMessage: string;

  constructor(code: ResendErrorCode, safeMessage: string, httpStatus = 502) {
    super(safeMessage);
    this.name = 'ResendDeliveryError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.safeMessage = safeMessage;
  }
}

const RESEND_API_ENDPOINT = 'https://api.resend.com/emails';
const PLAIN_EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const NAMED_EMAIL_RE = /^[^<>]+<\s*([^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)\s*>$/;

export function isValidResendFromEmail(value: string | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  if (PLAIN_EMAIL_RE.test(trimmed)) return true;
  const named = NAMED_EMAIL_RE.exec(trimmed);
  return Boolean(named && PLAIN_EMAIL_RE.test(named[1]));
}

export function getResendConfig(): {
  apiKey: string;
  fromEmail: string;
  configured: boolean;
} {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim() || '';
  const configured = Boolean(apiKey && isValidResendFromEmail(fromEmail));
  return {apiKey, fromEmail, configured};
}

export function isResendConfigured(): boolean {
  return getResendConfig().configured;
}

export function isMailConfigured(): boolean {
  return isResendConfigured();
}

export interface ResendSenderOptions {
  apiKey?: string;
  fromEmail?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function createResendMailSender(options: ResendSenderOptions = {}): MailDispatchFn {
  return async (payload: OutboundEmailPayload): Promise<MailDeliveryResult> => {
    const apiKey = (options.apiKey ?? process.env.RESEND_API_KEY)?.trim() || '';
    const fromEmail = (options.fromEmail ?? process.env.RESEND_FROM_EMAIL)?.trim() || '';

    if (!apiKey || !fromEmail) {
      throw new ResendDeliveryError(
        'RESEND_NOT_CONFIGURED',
        'Resend email delivery is not configured on the server. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
        503
      );
    }

    if (!isValidResendFromEmail(fromEmail)) {
      throw new ResendDeliveryError(
        'RESEND_INVALID_SENDER',
        'Configured RESEND_FROM_EMAIL is not a valid sender email address.',
        502
      );
    }

    const fetchFn = options.fetchImpl || globalThis.fetch;
    const timeoutMs = options.timeoutMs ?? 12000;

    let response: Response;
    try {
      response = await fetchFn(RESEND_API_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [payload.to],
          subject: payload.subject,
          text: payload.text,
          html: payload.html,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new ResendDeliveryError(
        'RESEND_NETWORK_ERROR',
        'Unable to reach Resend email API due to a network error or timeout.',
        502
      );
    }

    const body = (await response.json().catch(() => null)) as {
      id?: unknown;
      message?: unknown;
      name?: unknown;
      error?: unknown;
    } | null;

    if (!response.ok) {
      const apiMessage =
        typeof body?.message === 'string'
          ? body.message
          : typeof body?.error === 'string'
            ? body.error
            : '';
      const lower = apiMessage.toLowerCase();

      if (response.status === 429) {
        throw new ResendDeliveryError(
          'RESEND_RATE_LIMITED',
          'Email delivery is temporarily rate-limited by Resend. Please wait and try again.',
          429
        );
      }

      if (
        response.status === 401 ||
        lower.includes('api key') ||
        lower.includes('invalid_api_key') ||
        lower.includes('restricted_api_key')
      ) {
        throw new ResendDeliveryError(
          'RESEND_AUTH_FAILED',
          'Resend API authentication failed. Verify RESEND_API_KEY on the server.',
          502
        );
      }

      if (
        response.status === 403 ||
        response.status === 422 ||
        lower.includes('domain') ||
        lower.includes('verified') ||
        lower.includes('sender') ||
        lower.includes('from')
      ) {
        throw new ResendDeliveryError(
          'RESEND_INVALID_SENDER',
          'Resend rejected the sender address. Ensure RESEND_FROM_EMAIL belongs to a verified Resend domain.',
          502
        );
      }

      throw new ResendDeliveryError(
        'RESEND_API_ERROR',
        'Resend email service rejected the delivery request.',
        502
      );
    }

    const messageId = typeof body?.id === 'string' ? body.id.trim() : '';
    if (!messageId) {
      throw new ResendDeliveryError(
        'RESEND_INVALID_RESPONSE',
        'Resend did not return a valid email acceptance ID.',
        502
      );
    }

    return {
      id: messageId,
      provider: 'resend',
    };
  };
}

export function buildLoginOtpEmail(to: string, otp: string, ttlMinutes = 5): OutboundEmailPayload {
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
  ttlMinutes = 5
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
  ttlMinutes = 5
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
